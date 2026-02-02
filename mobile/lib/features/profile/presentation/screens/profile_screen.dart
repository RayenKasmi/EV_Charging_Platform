import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:random_avatar/random_avatar.dart';
import '../../../../core/injection.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../settings/presentation/screens/settings_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
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
                   child: RandomAvatar(
                      user.email,
                      height: 100, 
                      width: 100,
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
                
                const SizedBox(height: 40),

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
    );
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
