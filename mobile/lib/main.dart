import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/network/dio_client.dart';
import 'core/network/api_client.dart';
import 'core/storage/local_storage.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Local Storage
  await LocalStorage.init();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Initialize dependencies
    final localStorage = LocalStorage();
    final dioClient = DioClient(localStorage);
    final apiClient = ApiClient(dioClient.dio);

    return MultiProvider(
      providers: [
        // Provide dependencies to the app
        Provider<LocalStorage>.value(value: localStorage),
        Provider<ApiClient>.value(value: apiClient),
        
        // TODO: Team adds ViewModels here using ChangeNotifierProvider
        // Example:
        // ChangeNotifierProvider(
        //   create: (_) => AuthViewModel(authRepository),
        // ),
      ],
      child: MaterialApp(
        title: 'EV Charging App',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const HomePage(),
      ),
    );
  }
}

// Placeholder Home Page
class HomePage extends StatelessWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('EV Charging App'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.ev_station,
              size: 100,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 24),
            Text(
              'Project Skeleton Ready!',
              style: Theme.of(context).textTheme.displaySmall,
            ),
            const SizedBox(height: 16),
            Text(
              'Team can start building features',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}