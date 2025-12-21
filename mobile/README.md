# EV Charging Platform - Mobile App

Flutter mobile application for the EV Charging Platform, built with MVVM architecture and modern Flutter practices.

##  Project Overview

This is the mobile application component of the EV Charging Platform, providing users with a seamless experience to find, book, and manage electric vehicle charging stations. The app is built using Flutter with a clean MVVM (Model-View-ViewModel) architecture pattern.

##  Architecture

The project follows the **MVVM (Model-View-ViewModel)** architecture pattern with a clear separation of concerns:

```
mobile/
├── lib/
│   ├── core/                      # Core functionality and configurations
│   │   ├── constants/             # App-wide constants
│   │   │   ├── api_constants.dart # API endpoints and base URLs
│   │   │   └── app_constants.dart # App constants (strings, values)
│   │   ├── network/               # Network layer
│   │   │   ├── api_client.dart    # Retrofit API client
│   │   │   ├── api_result.dart    # API response wrapper
│   │   │   └── dio_client.dart    # Dio HTTP client with interceptors
│   │   ├── storage/               # Local storage layer
│   │   │   ├── hive_service.dart  # Hive database service
│   │   │   ├── token_storage.dart # Token management
│   │   │   ├── user_storage.dart  # User data storage
│   │   │   └── settings_storage.dart # App settings storage
│   │   ├── theme/                 # Theme configuration
│   │   │   ├── app_colors.dart    # Color palette
│   │   │   └── app_theme.dart     # Light & dark themes
│   │   └── utils/                 # Utility functions
│   │       ├── validators.dart    # Input validators
│   │       └── extensions.dart    # Extension methods
│   │
│   ├── features/                  # Feature modules (MVVM)
│   │   ├── auth/                  # Authentication feature
│   │   │   ├── models/            # Data models
│   │   │   ├── repositories/      # Data repositories
│   │   │   ├── viewmodels/        # Business logic
│   │   │   └── views/             # UI screens
│   │   ├── stations/              # Charging stations feature
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   ├── viewmodels/
│   │   │   └── views/
│   │   ├── bookings/              # Booking management feature
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   ├── viewmodels/
│   │   │   └── views/
│   │   └── profile/               # User profile feature
│   │       ├── models/
│   │       ├── repositories/
│   │       ├── viewmodels/
│   │       └── views/
│   │
│   ├── shared/                    # Shared components
│   │   ├── widgets/               # Reusable widgets
│   │   │   ├── custom_button.dart
│   │   │   ├── custom_text_field.dart
│   │   │   └── loading_indicator.dart
│   │   └── models/                # Shared data models
│   │
│   └── main.dart                  # App entry point
│
├── android/                       # Android-specific files
├── ios/                           # iOS-specific files
├── web/                           # Web-specific files
├── linux/                         # Linux-specific files
├── macos/                         # macOS-specific files
├── windows/                       # Windows-specific files
└── test/                          # Unit and widget tests
```

## 🔑 Key Features

### Current Implementation

-  **MVVM Architecture**: Clean separation between UI, business logic, and data layers
-  **State Management**: Provider pattern for reactive state management
-  **Network Layer**: Dio with interceptors and Retrofit for type-safe API calls
-  **Local Storage**: Hive database for offline data and token management
-  **Theme Support**: Light and dark theme configurations (pallet has to be determined by the team)
-  **Shared Widgets**: Reusable UI components (buttons, text fields, loading indicators)
-  **Utilities**: Input validators and extension methods


##  Getting Started

### Prerequisites

- Flutter SDK (3.5.4 or higher)
- Dart SDK (3.5.4 or higher)
- Android Studio / Xcode (for mobile development)
- VS Code or Android Studio with Flutter plugins

### Installation

1. **Navigate to the mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   flutter pub get
   ```

3. **Generate code (Retrofit API client, Hive adapters, JSON serializers):**
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

4. **Run the app:**
   ```bash
   # For development
   flutter run
   
   # For specific device
   flutter run -d <device_id>
   
   # List available devices
   flutter devices
   ```

### Configuration

Before running the app, ensure the API base URL is configured in:
- `lib/core/constants/api_constants.dart`

```dart
class ApiConstants {
  static const String baseUrl = 'http://your-api-url:3000/api';
  // Update with your backend URL
}
```

##  MVVM Architecture Explained

### Model
- Represents data structures and business entities
- Located in `features/*/models/`
- Uses `equatable` for value comparison
- JSON serializable for API communication

### View
- UI layer (Flutter widgets)
- Located in `features/*/views/`
- Observes ViewModel and reacts to state changes
- No business logic, only presentation

### ViewModel
- Business logic and state management
- Located in `features/*/viewmodels/`
- Extends `ChangeNotifier` for Provider pattern
- Communicates with repositories
- Exposes state and actions to Views

### Repository
- Data layer abstraction
- Located in `features/*/repositories/`
- Handles API calls and local storage
- Returns data to ViewModels

## 🔧 Development Guidelines

### Adding a New Feature

1. **Create feature folder structure:**
   ```
   lib/features/my_feature/
   ├── models/
   ├── repositories/
   ├── viewmodels/
   └── views/
   ```

2. **Define models:**
   ```dart
   // models/my_model.dart
   import 'package:equatable/equatable.dart';
   import 'package:json_annotation/json_annotation.dart';
   
   part 'my_model.g.dart';
   
   @JsonSerializable()
   class MyModel extends Equatable {
     final String id;
     final String name;
     
     const MyModel({required this.id, required this.name});
     
     factory MyModel.fromJson(Map<String, dynamic> json) => _$MyModelFromJson(json);
     Map<String, dynamic> toJson() => _$MyModelToJson(this);
     
     @override
     List<Object?> get props => [id, name];
   }
   ```

3. **Create repository:**
   ```dart
   // repositories/my_repository.dart
   class MyRepository {
     final ApiClient _apiClient;
     
     MyRepository(this._apiClient);
     
     Future<ApiResult<MyModel>> fetchData() async {
       try {
         final response = await _apiClient.getData();
         return ApiResult.success(response);
       } catch (e) {
         return ApiResult.failure(e.toString());
       }
     }
   }
   ```

4. **Implement ViewModel:**
   ```dart
   // viewmodels/my_viewmodel.dart
   class MyViewModel extends ChangeNotifier {
     final MyRepository _repository;
     bool _isLoading = false;
     MyModel? _data;
     String? _error;
     
     bool get isLoading => _isLoading;
     MyModel? get data => _data;
     String? get error => _error;
     
     MyViewModel(this._repository);
     
     Future<void> loadData() async {
       _isLoading = true;
       _error = null;
       notifyListeners();
       
       final result = await _repository.fetchData();
       result.when(
         success: (data) => _data = data,
         failure: (error) => _error = error,
       );
       
       _isLoading = false;
       notifyListeners();
     }
   }
   ```

5. **Build View:**
   ```dart
   // views/my_view.dart
   class MyView extends StatelessWidget {
     @override
     Widget build(BuildContext context) {
       return ChangeNotifierProvider(
         create: (_) => MyViewModel(context.read<MyRepository>()),
         child: Consumer<MyViewModel>(
           builder: (context, viewModel, _) {
             if (viewModel.isLoading) return LoadingIndicator();
             if (viewModel.error != null) return Text(viewModel.error!);
             return Text(viewModel.data?.name ?? 'No data');
           },
         ),
       );
     }
   }
   ```

6. **Register in main.dart:**
   ```dart
   MultiProvider(
     providers: [
       Provider(create: (_) => MyRepository(apiClient)),
     ],
     child: MaterialApp(...),
   )
   ```

### Code Generation

After modifying models or API clients, run:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### Testing

```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage

# Run specific test file
flutter test test/my_test.dart
```

##  Theming (to be determined by team)

The app supports light and dark themes. Access theme colors using:
```dart
AppColors.primary
AppColors.secondary
Theme.of(context).colorScheme.primary
```

Customize themes in `lib/core/theme/app_theme.dart` and `lib/core/theme/app_colors.dart`.

##  Authentication Flow

The app uses token-based authentication:
1. User logs in via API
2. Token is stored securely using `TokenStorage`
3. Token is automatically added to API requests via Dio interceptor
4. On token expiry, user is logged out


##  Contributing

When contributing to this codebase:

1. Follow the MVVM architecture pattern
2. Place feature-specific code in `features/<feature_name>/`
3. Use shared widgets from `shared/widgets/`
4. Keep business logic in ViewModels, not Views
5. Use the repository pattern for data access
6. Write tests for new features
7. Run code generation after model changes
8. Follow Dart style guidelines (use `flutter analyze`)

##  Useful Commands

```bash
# Get dependencies
flutter pub get

# Run code generation
flutter pub run build_runner build --delete-conflicting-outputs

# Watch for changes (continuous code generation)
flutter pub run build_runner watch

# Clean build
flutter clean && flutter pub get

# Run on specific device
flutter run -d chrome  # Web
flutter run -d windows # Windows
flutter run -d macos   # macOS

# Build release APK
flutter build apk --release

# Build iOS
flutter build ios --release

# Analyze code
flutter analyze

# Format code
dart format .
```
## Additional Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Provider Package](https://pub.dev/packages/provider)
- [Dio HTTP Client](https://pub.dev/packages/dio)
- [Retrofit](https://pub.dev/packages/retrofit)
- [Hive Database](https://pub.dev/packages/hive)
- [MVVM Pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel)


