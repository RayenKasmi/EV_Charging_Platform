# JWT Authentication Flow

## Registration Flow
```
Client                Controller              Service                 Database
  |                       |                      |                         |
  |---POST /register---->|                      |                         |
  |  {email, password}   |                      |                         |
  |                      |--register(dto)------>|                         |
  |                      |                      |--findUnique(email)----->|
  |                      |                      |<----user or null--------|
  |                      |                      |                         |
  |                      |                      |--hash(password)-------->|
  |                      |                      |<----passwordHash--------|
  |                      |                      |                         |
  |                      |                      |--create(user)---------->|
  |                      |                      |<----newUser-------------|
  |                      |                      |                         |
  |                      |                      |--generateTokens()------>|
  |                      |                      |<----tokens--------------|
  |                      |                      |                         |
  |                      |                      |--update(refreshToken)-->|
  |                      |<----{user, tokens}---|                         |
  |<----{user, tokens}---|                      |                         |
```

## Login Flow
```
Client                Controller              Service                 Database
  |                       |                      |                         |
  |---POST /login------->|                      |                         |
  |  {email, password}   |                      |                         |
  |                      |--login(dto)--------->|                         |
  |                      |                      |--findUnique(email)----->|
  |                      |                      |<----user----------------|
  |                      |                      |                         |
  |                      |                      |--bcrypt.compare()------>|
  |                      |                      |<----true/false----------|
  |                      |                      |                         |
  |                      |                      |--generateTokens()------>|
  |                      |                      |<----tokens--------------|
  |                      |                      |                         |
  |                      |                      |--update(refreshToken)-->|
  |                      |<----{user, tokens}---|                         |
  |<----{user, tokens}---|                      |                         |
```

## Accessing Protected Routes
```
Client                Guard                Strategy               Database
  |                     |                      |                         |
  |---GET /protected--->|                      |                         |
  |  Bearer: token      |                      |                         |
  |                     |--verify(token)------>|                         |
  |                     |                      |--decode(token)--------->|
  |                     |                      |<----payload-------------|
  |                     |                      |                         |
  |                     |                      |--findUnique(userId)---->|
  |                     |                      |<----user----------------|
  |                     |<----user-------------|                         |
  |<----response--------|                      |                         |
  |  (req.user = user)  |                      |                         |
```

## Refresh Token Flow
```
Client                Controller              Service                 Database
  |                       |                      |                         |
  |---POST /refresh----->|                      |                         |
  |  {refreshToken}      |                      |                         |
  |                      |--refreshTokens()---->|                         |
  |                      |  (via Guard)         |                         |
  |                      |                      |--findUnique(userId)---->|
  |                      |                      |<----user----------------|
  |                      |                      |                         |
  |                      |                      |--bcrypt.compare()------>|
  |                      |                      |<----true/false----------|
  |                      |                      |                         |
  |                      |                      |--generateTokens()------>|
  |                      |                      |<----newTokens-----------|
  |                      |                      |                         |
  |                      |                      |--update(refreshToken)-->|
  |                      |<----{newTokens}------|                         |
  |<----{newTokens}------|                      |                         |
```

## Logout Flow
```
Client                Controller              Service                 Database
  |                       |                      |                         |
  |---POST /logout------>|                      |                         |
  |  Bearer: token       |                      |                         |
  |                      |--logout()----------->|                         |
  |                      |  (via Guard)         |                         |
  |                      |                      |--update(null)---------->|
  |                      |                      |  refreshToken=null      |
  |                      |<----{message}--------|                         |
  |<----{message}--------|                      |                         |
```

## Token Structure

### Access Token Payload
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "iat": 1706198400,
  "exp": 1706803200
}
```

### Refresh Token Payload
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "iat": 1706198400,
  "exp": 1708790400
}
```

## Error Scenarios

### Registration Errors
- **409 Conflict**: Email already exists
- **400 Bad Request**: Invalid email format, password too short

### Login Errors
- **401 Unauthorized**: User not found or wrong password

### Refresh Errors
- **401 Unauthorized**: Invalid token, expired token, token mismatch

### Protected Route Errors
- **401 Unauthorized**: Missing token, invalid token, expired token, user not found
