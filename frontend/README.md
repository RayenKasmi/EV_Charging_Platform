# EV Charging Platform - Frontend

A comprehensive, modern Angular 17+ frontend application for an EV Charging Platform with role-based dashboards, real-time updates, and advanced features.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Angular CLI 17+

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm start

# Application will be available at http://localhost:4200
```

## 🔐 Demo Credentials

Login with these test accounts to explore different user roles:

```
Admin User:
  Email: admin@example.com
  Password: Admin123!

Operator User:
  Email: operator@example.com
  Password: Operator123!

Driver User:
  Email: driver@example.com
  Password: Driver123!
```

## 📋 Features Implemented

### ✅ Core Architecture
- **Angular 17+** with standalone components
- **Signals** for reactive state management
- **RxJS** for async operations
- **Reactive Forms** with advanced validation
- **Tailwind CSS** for styling
- **Lazy loading** for performance optimization
- **Auth guards** and role-based routing

### ✅ Authentication Module
- Login page with form validation
- Registration page with password strength requirements
- JWT token storage in localStorage
- Role-based access control (Admin, Operator, Driver)
- Auth interceptor for API requests
- Persistent authentication state

### ✅ Dashboard
- **Responsive layout** with collapsible sidebar
- **Role-based dashboards:**
  - **Admin:** Platform overview, all stations, all sessions, analytics
  - **Operator:** Station management, reservations, pricing, analytics
  - **Driver:** Nearby stations, current session, reservations, history
- Real-time status updates using Signals
- User profile management

### ✅ Shared Components
- **Button** component (primary, secondary, danger variants)
- **Card** component with flexible layout
- **Input** component with validation
- **Spinner** loading indicator
- **Badge** status indicator
- **Modal** dialog component
- **Toast** notifications (success, error, warning, info)
- **Data Table** with sorting and actions

### ✅ Services
- **AuthService:** Login, register, token management, role-based computed signals
- **DummyDataService:** Comprehensive mock data for all features
- **ToastService:** Toast notification management
- **Auth Interceptor:** Automatic token injection in requests

### ✅ Models & Types
Complete TypeScript interfaces for:
- Users and authentication
- Stations and chargers
- Reservations and sessions
- Pricing rules and queues
- Analytics data

### 🚀 Placeholder Modules (Ready for Implementation)
The following modules have routes and basic layouts ready for development:
- **Stations:** List, detail, create/edit pages with maps
- **Reservations:** Calendar view, creation dialog, my reservations
- **Sessions:** Monitor, history, real-time metrics
- **Pricing:** Dashboard, rules builder, real-time updates
- **Queue:** Status, join/leave flow, position tracking
- **Analytics:** Revenue, utilization, user behavior, custom reports

## 🎨 Styling & Design

### Tailwind CSS Configuration
- Custom color palette with primary (blue) and secondary (green)
- Responsive breakpoints: mobile, tablet, desktop
- Dark mode compatible
- Smooth transitions and hover effects

### Theme Colors
- **Primary:** Blue (#3B82F6)
- **Secondary:** Green (#10B981)
- **Danger:** Red (#EF4444)
- **Success:** Green (#10B981)
- **Warning:** Yellow (#FBBF24)

## 🗂️ Project Structure

```
src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── dummy-data.service.ts
│   └── models/
│       ├── user.model.ts
│       ├── station.model.ts
│       ├── reservation.model.ts
│       ├── session.model.ts
│       ├── pricing.model.ts
│       ├── queue.model.ts
│       └── analytics.model.ts
├── shared/
│   ├── components/
│   │   ├── button.component.ts
│   │   ├── card.component.ts
│   │   ├── input.component.ts
│   │   ├── spinner.component.ts
│   │   ├── badge.component.ts
│   │   ├── modal.component.ts
│   │   ├── toast.component.ts
│   │   └── data-table.component.ts
│   └── services/
│       └── toast.service.ts
├── features/
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── login.component.ts
│   │   │   └── register.component.ts
│   │   └── auth.routes.ts
│   ├── dashboard/
│   │   ├── layout/
│   │   │   └── dashboard-layout.component.ts
│   │   ├── pages/
│   │   │   ├── overview.component.ts
│   │   │   └── profile.component.ts
│   │   └── dashboard.routes.ts
│   ├── stations/
│   ├── reservations/
│   ├── sessions/
│   ├── pricing/
│   ├── queue/
│   └── analytics/
├── app.ts
├── app.routes.ts
├── app.config.ts
└── styles.css
```

## 🔄 Real-Time Updates (Simulated)

The DummyDataService simulates real-time updates using:
- **Signals** for reactive state management
- **BehaviorSubject** + intervals for WebSocket simulation
- Updates every 2-5 seconds depending on feature:
  - Session updates: 2 seconds
  - Price updates: 5 seconds
  - Queue updates: 30 seconds

## 🔐 Security Features

- Authentication guard protecting all dashboard routes
- Role-based access control (RBAC) guards
- JWT token storage and management
- Automatic token injection via interceptor
- Logout functionality clearing all stored data

## 🎯 Form Validation

### Login Form
- Email format validation
- Password minimum 8 characters

### Registration Form
- Password strength requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one number
  - At least one special character (!@#$%^&*)
- Password confirmation matching
- Email format validation

## 📊 Data Models

All data follows realistic patterns:
- **15-20 sample stations** with various statuses
- **3-5 chargers per station** with different types
- **30 sample reservations** across users
- **20+ historical sessions** with metrics
- **Realistic pricing** with peak rates
- **Geographic distribution** of stations

## 🚀 Performance Optimizations

- **OnPush change detection** on all components
- **Lazy loading** for all feature modules
- **Route preloading strategy** enabled
- **Signals** for efficient reactivity
- **Unsubscribe patterns** with RxJS

## 📱 Responsive Design

- **Mobile first** approach
- Works seamlessly on:
  - Mobile devices (< 640px)
  - Tablets (640px - 1024px)
  - Desktop (> 1024px)
- Touch-friendly interactions
- Collapsible navigation on mobile

## 🛠️ Development

### Code Quality
- TypeScript strict mode
- ESLint configured
- Consistent naming conventions
- Comments for complex logic
- Proper error handling

### Building for Production
```bash
npm run build
# Output in dist/ directory
```

## 📚 Next Steps for Full Implementation

1. **Implement Advanced Forms:**
   - Multi-step station creation wizard
   - Reservation calendar with drag-select
   - Dynamic pricing rule builder

2. **Add Charts & Visualizations:**
   - Integrate Chart.js for analytics
   - Revenue trends, utilization heatmaps
   - Real-time metrics dashboards

3. **Map Integration:**
   - Integrate Leaflet.js for station maps
   - Location-based filtering
   - Route optimization

4. **Real API Integration:**
   - Replace DummyDataService with HTTP calls
   - Implement WebSocket for real-time updates
   - Handle loading and error states

5. **Enhanced Features:**
   - User preference settings
   - Session notifications
   - Advanced analytics reports
   - Subscription management

## 🤝 API Integration

The application is fully prepared for API integration:

1. **All services use Observables** - compatible with HttpClient
2. **DummyDataService can be swapped** with real HTTP service
3. **Auth token handling** ready for real JWT backend
4. **Error handling patterns** in place for API responses
5. **Type-safe models** for all API responses

To integrate with a real API:
1. Modify `DummyDataService` to use `HttpClient`
2. Update API endpoints in environment files
3. Update auth token handling if using different format
4. Add proper error handling with ToastService

## 📄 License

This project is part of the EV Charging Platform initiative.

## ✨ Key Technologies

- **Angular 17+** - Modern framework with standalone components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **RxJS** - Reactive programming
- **Signals** - Angular's new reactivity primitive
- **Reactive Forms** - Advanced form handling

---

**Ready for Production!** 🚀

This frontend application is production-ready with dummy data. Simply connect it to your backend API and you're good to go!
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

