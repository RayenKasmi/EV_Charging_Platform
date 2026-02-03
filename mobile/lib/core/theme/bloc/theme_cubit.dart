import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:injectable/injectable.dart';

part 'theme_state.dart';

@singleton
class ThemeCubit extends Cubit<ThemeState> {
  // Default to Light Mode
  ThemeCubit() : super(const ThemeState(ThemeMode.light));

  void toggleTheme(bool isDark) {
    emit(ThemeState(isDark ? ThemeMode.dark : ThemeMode.light));
  }

  void setTheme(ThemeMode mode) {
    emit(ThemeState(mode));
  }
}
