import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/bloc/theme_cubit.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final themeCubit = context.read<ThemeCubit>();
    final isDark = themeCubit.state.isDarkMode;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Settings"),
      ),
      body: ListView(
        children: [
          const SizedBox(height: 20),
          _buildSectionHeader(context, "Appearance"),
          BlocBuilder<ThemeCubit, ThemeState>(
            builder: (context, state) {
              return SwitchListTile(
                title: const Text("Dark Mode"),
                secondary: const Icon(Icons.dark_mode_outlined),
                value: state.themeMode == ThemeMode.dark,
                onChanged: (value) {
                  context.read<ThemeCubit>().toggleTheme(value);
                },
              );
            },
          ),
          
          _buildSectionHeader(context, "Account"),
          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text("Notifications"),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {},
          ),
          ListTile(
             leading: const Icon(Icons.lock_outline),
            title: const Text("Privacy & Security"),
             trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {},
          ),

           _buildSectionHeader(context, "About"),
           ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text("Version"),
            subtitle: const Text("1.0.0+1"),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: Theme.of(context).colorScheme.primary,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
