# EV Charging Platform - Backend

A scalable NestJS backend for the EV Charging Platform, built with Domain-Driven Design principles, PostgreSQL via Prisma ORM, and Supabase integration.

##  Project Structure

The backend follows a modular, DDD-based architecture:

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Root controller
│   ├── app.service.ts             # Root service
│   │
│   ├── auth/                      # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   │
│   ├── users/                     # User management module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   └── users.service.ts
│   │
│   ├── stations/                  # Charging stations module
│   │   ├── stations.module.ts
│   │   ├── stations.controller.ts
│   │   └── stations.service.ts
│   │
│   ├── bookings/                  # Booking management module
│   │   └── bookings.module.ts
│   │
│   ├── payments/                  # Payment processing module
│   │   └── payments.module.ts
│   │
│   ├── prisma/                    # Prisma ORM integration
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   └── common/                    # Shared utilities
│       ├── filters/
│       │   └── http-exception.filter.ts    # Global exception handling
│       └── middleware/
│           └── logger.middleware.ts        # HTTP request logging
│
├── prisma/
│   └── schema.prisma              # Database schema definition
│
├── generated/
│   └── prisma/                    # Auto-generated Prisma Client
│
├── dist/                          # Compiled output
├── test/                          # E2E tests
├── package.json
└── tsconfig.json
```

##  Key Features

### Core Modules
- **Auth Module**: User authentication and authorization
- **Users Module**: User profile management
- **Stations Module**: Charging station CRUD operations
- **Bookings Module**: Reservation and booking management
- **Payments Module**: Payment processing integration

### Infrastructure
- **Global Validation Pipe**: Automatic DTO validation with class-validator
- **Centralized Exception Filter**: Consistent error response formatting
- **HTTP Logging Middleware**: Request/response logging for debugging
- **Swagger/OpenAPI Documentation**: Auto-generated API documentation
- **Environment Configuration**: Type-safe config management with `@nestjs/config`

##  Database & Prisma ORM

This project uses **Prisma ORM** with **PostgreSQL** hosted on **Supabase** (direct connection).

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure database connection:**
   Create a `.env` file in the `backend` directory:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public&pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"
   ```

   - `DATABASE_URL`: For connection pooling (PgBouncer)
   - `DIRECT_URL`: For migrations and schema operations

### Prisma Workflow

#### 1. **Generate Prisma Client**
After modifying `prisma/schema.prisma`, generate the client:

```bash
npx prisma generate
```

This creates the typed Prisma Client in `backend/generated/prisma/`.

#### 2. **Database Migrations (Recommended for Production)**

**Create a migration:**
```bash
npx prisma migrate dev --name descriptive_migration_name
```
This will:
- Create a migration file in `prisma/migrations/`
- Apply the migration to your database
- Regenerate Prisma Client

**Apply pending migrations:**
```bash
npx prisma migrate deploy
```

**Reset database ( Development only):**
```bash
npx prisma migrate reset
```

#### 3. **Database Push (Quick Prototyping)**

For rapid development without creating migration files:

```bash
npx prisma db push
```

⚠️ **Warning**: This syncs your schema to the database without migration history. Use `migrate dev` for production-ready workflows.

#### 4. **Database Pull (Introspection)**

Generate Prisma schema from existing database:

```bash
npx prisma db pull
```

This introspects your database and updates `schema.prisma`.

#### 5. **Database Seeding**

If you have a seed script configured in `package.json`:

```bash
npx prisma db seed
```

#### 6. **Prisma Studio (Database GUI)**

Open a visual editor for your database:

```bash
npx prisma studio
```

Access at `http://localhost:5555`

### Common Workflows

#### Adding a New Model

1. Define the model in `prisma/schema.prisma`:
   ```prisma
   model ChargingSession {
     id          String   @id @default(uuid())
     userId      String
     stationId   String
     startTime   DateTime @default(now())
     endTime     DateTime?
     energyUsed  Float?
     cost        Float?
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt

     user    User    @relation(fields: [userId], references: [id])
     station Station @relation(fields: [stationId], references: [id])
   }
   ```

2. Create and apply migration:
   ```bash
   npx prisma migrate dev --name add_charging_session
   ```

3. Use in your service:
   ```typescript
   import { PrismaService } from '../prisma/prisma.service';

   export class SessionsService {
     constructor(private prisma: PrismaService) {}

     async createSession(data: CreateSessionDto) {
       return this.prisma.chargingSession.create({ data });
     }
   }
   ```

#### Modifying an Existing Model

1. Update `prisma/schema.prisma`
2. Run migration:
   ```bash
   npx prisma migrate dev --name update_model_name
   ```

#### Checking Migration Status

```bash
npx prisma migrate status
```

##  Development

### Running the Application

**Development mode (with watch):**
```bash
npm run start:dev
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📚 API Documentation

When the application is running, access Swagger documentation at:

```
http://localhost:3000/api
```

## 🔐 Environment Variables

Required environment variables (`.env`):

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Application
PORT=3000
NODE_ENV=development

# JWT (if using authentication)
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Supabase (if using additional features)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

## 📦 Key Dependencies

- **NestJS**: Progressive Node.js framework
- **Prisma**: Next-generation ORM
- **PostgreSQL**: Relational database (via Supabase)
- **class-validator**: DTO validation
- **class-transformer**: Object transformation
- **@nestjs/config**: Configuration management
- **@nestjs/swagger**: API documentation

##  Troubleshooting

### Prisma Client not found

```bash
npx prisma generate
```

### Database connection issues

1. Verify `.env` file has correct `DATABASE_URL` and `DIRECT_URL`
2. Check Supabase project is running
3. Ensure IP allowlist includes your IP (Supabase dashboard)

### Migration conflicts

```bash
# Reset and reapply (⚠️ data loss)
npx prisma migrate reset

# Or resolve manually
npx prisma migrate resolve --applied <migration_name>
```

##  Best Practices

1. **Always generate Prisma Client** after schema changes
2. **Use migrations** for production, not `db push`
3. **Keep schema.prisma in sync** with your database
4. **Use DTOs** for request validation in controllers
5. **Inject PrismaService** via dependency injection
6. **Handle errors** with proper exception filters
7. **Document endpoints** with Swagger decorators

