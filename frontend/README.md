# EV Charging Platform - Frontend

Angular 20+ standalone application for the EV Charging Platform, featuring a modular architecture with lazy-loaded routes, authentication, and real-time capabilities.

##  Tech Stack

- **Angular 20.3** (Standalone Components)
- **TypeScript** with strict mode
- **RxJS 7.8** for reactive programming
- **SCSS** for styling
- **ESLint + Prettier** for code quality
- **Husky + lint-staged** for pre-commit hooks (configured at root)

##  Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Core functionality (singleton services, guards, interceptors)
│   │   │   ├── guards/             # Route guards (auth, role-based access)
│   │   │   ├── interceptors/       # HTTP interceptors (auth token injection)
│   │   │   ├── models/             # Core data models and interfaces
│   │   │   └── services/           # Core services (auth, API, WebSocket)
│   │   │
│   │   ├── features/               # Feature modules (lazy-loaded)
│   │   │   ├── auth/               # Authentication (login, register)
│   │   │   ├── dashboard/          # Dashboard views
│   │   │   ├── stations/           # Station management
│   │   │   ├── bookings/           # Booking management
│   │   │   └── profile/            # User profile
│   │   │
│   │   ├── shared/                 # Shared resources
│   │   │   ├── components/         # Reusable components
│   │   │   ├── directives/         # Custom directives
│   │   │   ├── pipes/              # Custom pipes
│   │   │   └── utils/              # Utility functions
│   │   │
│   │   ├── state/                  # State management
│   │   │   └── signals/            # Angular signals for state
│   │   │
│   │   ├── app.config.ts           # Application configuration
│   │   ├── app.routes.ts           # Root routing configuration
│   │   └── app.ts                  # Root component
│   │
│   ├── environments/               # Environment configurations
│   │   ├── environment.ts          # Development environment
│   │   └── environment.prod.ts     # Production environment
│   │
│   ├── index.html                  # Main HTML file
│   ├── main.ts                     # Application entry point
│   └── styles.scss                 # Global styles
│
├── angular.json                    # Angular CLI configuration
├── tsconfig.json                   # TypeScript configuration with path aliases
├── eslint.config.js                # ESLint configuration
└── package.json                    # Dependencies and Prettier config
```

##  Key Features

### 1. **Modular Architecture**
- Feature-based folder structure
- Lazy-loaded routes for optimal performance
- Clear separation of concerns (core, shared, features, state)

### 2. **Path Aliases**
TypeScript path aliases configured in `tsconfig.json`:
```typescript
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent } from '@shared/components/button.component';
import { LoginComponent } from '@features/auth/login/login';
import { environment } from '@env/environment';
```

### 3. **Authentication**
- HTTP interceptor for automatic token injection
- Auth routes with login and register components
- Protected routes with guards (ready to implement)

### 4. **Code Quality**
- **ESLint** with Angular-specific rules and Prettier integration
- **Prettier** configured for consistent formatting
- **Husky pre-commit hooks** (configured at root level) run lint-staged
- Automatic linting and formatting before commits

### 5. **Environment Configuration**
```typescript
// environment.ts
{
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000',
  version: '1.0.0'
}
```

### 6. **Lazy Loading**
Feature modules are lazy-loaded for better performance:
```typescript
{
  path: 'auth',
  loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
}
```

##  Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The application will run on `http://localhost:4200`

##  Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run watch` | Build in watch mode (development) |
| `npm test` | Run unit tests with Karma |
| `npm run lint` | Lint code with ESLint |

##  Development Guidelines

### Creating New Features
1. Create feature folder in `src/app/features/`
2. Create feature routes file (`feature.routes.ts`)
3. Add lazy-loaded route in `app.routes.ts`
4. Follow the existing structure (components, services, models)

### Using Path Aliases
Always use path aliases for cleaner imports:
```typescript
//  Good
import { AuthService } from '@core/services/auth.service';

//  Avoid
import { AuthService } from '../../core/services/auth.service';
```

### Code Style
- Prettier and ESLint are configured to run automatically on commit
- Run `npm run lint` to check for issues manually
- Follow Angular style guide conventions
- Use standalone components (no NgModules)

### Component Naming
- Use standalone components with `.ts` extension
- Template files: `.html`
- Styles: `.scss`
- Tests: `.spec.ts`

Example:
```
login/
├── login.ts          # Component class
├── login.html        # Template
├── login.scss        # Styles
└── login.spec.ts     # Tests
```

##  Authentication Flow

1. User logs in via `/auth/login`
2. JWT token received and stored (localStorage/sessionStorage)
3. Auth interceptor automatically attaches token to API requests
4. Protected routes use auth guard to verify authentication

##  API Integration

Base API URL configured in environment files:
- **Development**: `http://localhost:3000/api`
- **Production**: Configure in `environment.prod.ts`

WebSocket URL for real-time features:
- **Development**: `ws://localhost:3000`

##  Key Dependencies

- `@angular/core` - Angular framework
- `@angular/router` - Client-side routing
- `@angular/forms` - Form handling
- `rxjs` - Reactive extensions

##  Testing

Tests are configured with Jasmine and Karma:
```bash
npm test
```

##  Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory, ready for deployment.

##  Notes for Developers

- **Standalone Components**: This project uses Angular's standalone API (no NgModules)
- **Signals**: State management uses Angular signals in `src/app/state/signals/`
- **Strict Mode**: TypeScript strict mode is enabled for better type safety
- **Interceptors**: Auth interceptor is registered in `app.config.ts`
- **Lazy Loading**: All feature routes are lazy-loaded for optimal bundle size

##  Contributing

1. Follow the established folder structure
2. Use path aliases consistently
3. Write tests for new features
4. Ensure linting passes before committing
5. Keep components small and focused
6. Document complex logic

##  License

See root LICENSE file.

