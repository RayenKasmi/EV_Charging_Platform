import 'package:flutter/material.dart';
/*
TODO:
These are temporary placeholder colors update them with project color pallet
*/
class AppColors {
  // Primary Colors
  static const Color primary = Color(0xFF2196F3);
  static const Color primaryDark = Color(0xFF1976D2);
  static const Color primaryLight = Color(0xFF64B5F6);

  // Secondary Colors
  static const Color secondary = Color(0xFF03DAC6);
  static const Color secondaryDark = Color(0xFF018786);

  // Background Colors
  static const Color background = Color(0xFFF5F5F5); // Light grey for background
  static const Color surface = Color(0xFFFFFFFF); // White for cards/surfaces

  // Background Colors - Dark Mode Refined
  static const Color backgroundDark = Color(0xFF121212); 
  static const Color surfaceDark = Color(0xFF1E1E1E); // Slightly lighter than background
  static const Color surfaceContainerDark = Color(0xFF2C2C2C); // For elevated cards

  // Status Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color error = Color(0xFFCF6679); // Softer error for dark mode usually
  static const Color warning = Color(0xFFFF9800);
  static const Color info = Color(0xFF2196F3);

  // Text Colors
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textPrimaryDark = Color(0xFFE0E0E0); // Off-white is better for eyes
  static const Color textSecondaryDark = Color(0xFFA0A0A0);

  // Border Colors
  static const Color border = Color(0xFFE0E0E0);
  static const Color borderDark = Color(0xFF333333);
}