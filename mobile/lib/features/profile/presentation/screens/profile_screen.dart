import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:random_avatar/random_avatar.dart';
import '../../../../core/injection.dart';
import '../../../../core/services/secure_storage_service.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../settings/presentation/screens/settings_screen.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String? _localImagePath;

  @override
  void initState() {
    super.initState();
    _loadProfileImage();
  }

  Future<void> _loadProfileImage() async {
    // We need to access getIt<SecureStorageService>() but it's not directly exposed in main. 
    // Usually we use Bloc to get data, but image path is local-only for now (not in User model).
    // So let's use the service directly.
    final storage = getIt<SecureStorageService>();
    final path = await storage.getProfileImage();
    if (mounted) {
      setState(() {
        _localImagePath = path;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
           // Reload image when auth state changes (e.g. after update)
           _loadProfileImage();
        }
      },
      child: BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is! AuthAuthenticated) {
           return const Center(child: Text("Not Authenticated"));
        }

        final user = state.user;

        return Scaffold(
          appBar: AppBar(
            title: const Text('Profile'),
            actions: [
              IconButton(
                icon: const Icon(Icons.settings),
                onPressed: () {
                   Navigator.push(
                    context, 
                    MaterialPageRoute(builder: (_) => const SettingsScreen())
                   );
                },
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                const SizedBox(height: 20),
                // Avatar
                 Hero(
                   tag: 'profile_avatar',
                   child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Theme.of(context).colorScheme.primary, width: 2),
                      ),
                      child: ClipOval(
                        child: _localImagePath != null
                            ? (kIsWeb 
                                ? Image.network(_localImagePath!, fit: BoxFit.cover)
                                : Image.file(File(_localImagePath!), fit: BoxFit.cover))
                            : RandomAvatar(
                                user.email,
                                height: 100, 
                                width: 100,
                              ),
                      ),
                   ),
                 ),
                const SizedBox(height: 16),
                
                // Name & Email
                 Text(
                  user.fullName, 
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  user.email, 
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey),
                ),

                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                    );
                  },
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text("Edit Profile"),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  ),
                ),
                
                const SizedBox(height: 30),

                // Stats Cards
                const Row(
                  children: [
                     Expanded(child: _StatCard(label: "Trips", value: "12")),
                     SizedBox(width: 10),
                     Expanded(child: _StatCard(label: "kWh", value: "350")),
                     SizedBox(width: 10),
                     Expanded(child: _StatCard(label: "Saved", value: "45kg")), // CO2
                  ],
                ),
                
                 const SizedBox(height: 30),

                 _buildProfileMenu(context),

                 const SizedBox(height: 30),

                 ElevatedButton(
                  onPressed: () {
                     context.read<AuthBloc>().add(const AuthLogoutRequested());
                  }, 
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.errorContainer,
                    foregroundColor: Theme.of(context).colorScheme.onErrorContainer,
                    elevation: 0,
                    minimumSize: const Size(double.infinity, 50)
                  ),
                  child: const Text("Log Out")
                 )
              ],
            ),
          ),
        );
      },
    ));
  }

  Widget _buildProfileMenu(BuildContext context) {
    return Card(
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.history),
            title: const Text("Charging History"),
            trailing: const Icon(Icons.arrow_forward_ios, size: 14),
            onTap: () {},
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.credit_card),
            title: const Text("Payment Methods"),
            trailing: const Icon(Icons.arrow_forward_ios, size: 14),
            onTap: () {},
          ),
          const Divider(height: 1),
           ListTile(
            leading: const Icon(Icons.directions_car),
            title: const Text("My Vehicles"),
            trailing: const Icon(Icons.arrow_forward_ios, size: 14),
            onTap: () {},
          ),
        ],
      )
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;

  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
