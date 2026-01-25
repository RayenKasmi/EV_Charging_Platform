# JWT Authentication Implementation - US-2.1

## Overview
This implementation provides complete JWT-based authentication for the EV Charging Platform backend using NestJS, Passport.js, and bcrypt.

## What Was Implemented

### 1. **Database Schema Updates**
- Added `refreshToken` field to User model in Prisma schema
- Created and applied migration `20260125145549_add_refresh_token`

### 2. **Environment Configuration**
Added JWT configuration to `.env`:
- `JWT_SECRET` - Secret key for access tokens
- `JWT_ACCESS_TOKEN_EXPIRATION=7d` - Access token expires in 7 days
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens  
- `JWT_REFRESH_TOKEN_EXPIRATION=30d` - Refresh token expires in 30 days

### 3. **Authentication Strategies**
Created two Passport.js JWT strategies:
- **JwtStrategy** ([jwt.strategy.ts](src/auth/strategies/jwt.strategy.ts)) - Validates access tokens from Authorization Bearer header
- **JwtRefreshStrategy** ([jwt-refresh.strategy.ts](src/auth/strategies/jwt-refresh.strategy.ts)) - Validates refresh tokens from request body

### 4. **DTOs (Data Transfer Objects)**
- **RegisterDto** - Validates registration data (email, password, fullName)
- **LoginDto** - Validates login credentials (email, password)
- **RefreshTokenDto** - Validates refresh token requests

### 5. **Guards**
- **JwtAuthGuard** - Protects routes requiring authentication
- **JwtRefreshAuthGuard** - Protects the refresh token endpoint

### 6. **Auth Service** ([auth.service.ts](src/auth/auth.service.ts))
Implements all authentication logic:

#### `register(registerDto)`
- Validates unique email
- Hashes password with bcrypt (10 salt rounds)
- Creates new user in database
- Generates access & refresh tokens
- Stores hashed refresh token in database
- Returns user data and tokens

#### `login(loginDto)`
- Finds user by email
- Verifies password using bcrypt.compare()
- Generates new access & refresh tokens
- Updates refresh token in database
- Returns user data and tokens
- Throws `UnauthorizedException` for invalid credentials

#### `refreshTokens(userId, refreshToken)`
- Validates user exists
- Compares provided refresh token with stored hash
- Generates new token pair
- Updates refresh token in database
- Throws `UnauthorizedException` for invalid tokens

#### `logout(userId)`
- Removes refresh token from database
- Returns success message

### 7. **Auth Controller** ([auth.controller.ts](src/auth/auth.controller.ts))
Implements all required endpoints with Swagger documentation:

| Endpoint | Method | Description | Protected |
|----------|--------|-------------|-----------|
| `/auth/register` | POST | Register new user | No |
| `/auth/login` | POST | Login user | No |
| `/auth/refresh` | POST | Refresh access token | Yes (JwtRefreshAuthGuard) |
| `/auth/logout` | POST | Logout user | Yes (JwtAuthGuard) |

### 8. **Security Features**

#### Password Security
- Passwords hashed using bcrypt with 10 salt rounds
- Never stored in plain text
- Validated using bcrypt.compare()

#### JWT Token Security
- Access tokens include: user ID (sub), email, role
- Refresh tokens include: user ID (sub), email, role
- Tokens signed with separate secrets
- Access tokens expire in 7 days
- Refresh tokens expire in 30 days
- Refresh tokens hashed before storage in database

#### Error Handling
- `ConflictException` - Email already exists during registration
- `UnauthorizedException` - Invalid credentials during login
- `UnauthorizedException` - Invalid/expired tokens
- `BadRequestException` - Invalid input data (via class-validator)

### 9. **Utilities**
- **GetUser Decorator** ([get-user.decorator.ts](src/auth/decorators/get-user.decorator.ts)) - Extracts user from request in protected routes

### 10. **Module Configuration** ([auth.module.ts](src/auth/auth.module.ts))
- Configured JwtModule
- Registered both JWT strategies
- Imported PassportModule for strategy support
- Imported PrismaModule for database access
- Exported AuthService for use in other modules

## Usage Examples

### Register a New User
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "fullName": "John Doe"
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "CUSTOMER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Refresh Token
```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout
```bash
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Using Protected Routes

To protect any route, use the `JwtAuthGuard`:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { GetUser } from './auth/decorators/get-user.decorator';

@Controller('profile')
export class ProfileController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUser() user) {
    return user; // { id, email, role, fullName }
  }
}
```

## Acceptance Criteria ✅

- ✅ Passport.js configured with JWT strategy
- ✅ POST /auth/register endpoint implemented
- ✅ POST /auth/login endpoint implemented  
- ✅ POST /auth/refresh endpoint implemented
- ✅ POST /auth/logout endpoint implemented
- ✅ Password hashing with bcrypt
- ✅ JWT tokens include user ID, email, roles
- ✅ Access token expires in 7 days
- ✅ Refresh token expires in 30 days
- ✅ Error handling for invalid credentials

## Dependencies Used

All dependencies were already installed:
- `@nestjs/jwt` - JWT module for NestJS
- `@nestjs/passport` - Passport integration for NestJS
- `passport` - Authentication middleware
- `passport-jwt` - JWT strategy for Passport
- `bcrypt` - Password hashing library
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation

## Security Recommendations

1. **Change Default Secrets**: Update `JWT_SECRET` and `JWT_REFRESH_SECRET` in production
2. **Use Environment Variables**: Never commit secrets to version control
3. **HTTPS Only**: Always use HTTPS in production
4. **Token Rotation**: Refresh tokens are rotated on each refresh request
5. **Logout Invalidation**: Refresh tokens removed from database on logout
6. **Password Policy**: Minimum 8 characters enforced via validation

## Next Steps

Consider implementing:
- Email verification for new registrations
- Password reset functionality
- Rate limiting on auth endpoints
- Multi-factor authentication (MFA)
- Role-based access control (RBAC) decorators
- Blacklist for revoked access tokens
