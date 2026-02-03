import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../data/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

@singleton
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;

  AuthBloc(this._authRepository) : super(const AuthInitial()) {
    on<AuthCheckRequested>(_onAuthCheckRequested);
    on<AuthLoginRequested>(_onAuthLoginRequested);
    on<AuthRegisterRequested>(_onAuthRegisterRequested);
    on<AuthLogoutRequested>(_onAuthLogoutRequested);
    on<AuthTokenRefreshRequested>(_onAuthTokenRefreshRequested);
    on<AuthUpdateProfileRequested>(_onAuthUpdateProfileRequested);
  }

  Future<void> _onAuthCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final isAuthenticated = await _authRepository.isAuthenticated();

    if (isAuthenticated) {
      final user = await _authRepository.getCurrentUser();
      if (user != null) {
        emit(AuthAuthenticated(user));
      } else {
        emit(const AuthUnauthenticated());
      }
    } else {
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onAuthLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _authRepository.login(event.request);

    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (response) => emit(AuthAuthenticated(response.user)),
    );
  }

  Future<void> _onAuthRegisterRequested(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _authRepository.register(event.request);

    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (response) => emit(AuthAuthenticated(response.user)),
    );
  }

  Future<void> _onAuthLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _authRepository.logout();
    
    // Always emit unauthenticated, even if server logout failed
    // because we cleared local storage
    result.fold(
      (failure) {
        // Log the error but still logout locally
        print('Logout error (ignored): ${failure.message}');
        emit(const AuthUnauthenticated());
      },
      (_) => emit(const AuthUnauthenticated()),
    );
  }

  Future<void> _onAuthTokenRefreshRequested(
    AuthTokenRefreshRequested event,
    Emitter<AuthState> emit,
  ) async {
    final result = await _authRepository.refreshToken();

    result.fold(
      (failure) {
        // If refresh fails, logout user
        emit(const AuthUnauthenticated());
      },
      (response) => emit(AuthAuthenticated(response.user)),
    );
  }

  Future<void> _onAuthUpdateProfileRequested(
    AuthUpdateProfileRequested event,
    Emitter<AuthState> emit,
  ) async {
    // Current state should be authenticated to update profile
    if (state is! AuthAuthenticated) return;
    
    // We can emit loading, but that might flicker the whole screen. 
    // Usually better to have a specific status, but let's just do optimistic update or loading.
    // emit(const AuthLoading()); 

    final result = await _authRepository.updateProfile(
      fullName: event.fullName,
      imagePath: event.imagePath,
    );

    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (updatedUser) => emit(AuthAuthenticated(updatedUser)),
    );
  }
}
