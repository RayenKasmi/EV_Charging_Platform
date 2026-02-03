import 'package:equatable/equatable.dart';
import '../../data/models/login_request_model.dart';
import '../../data/models/register_request_model.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AuthCheckRequested extends AuthEvent {
  const AuthCheckRequested();
}

class AuthLoginRequested extends AuthEvent {
  final LoginRequestModel request;

  const AuthLoginRequested(this.request);

  @override
  List<Object?> get props => [request];
}

class AuthRegisterRequested extends AuthEvent {
  final RegisterRequestModel request;

  const AuthRegisterRequested(this.request);

  @override
  List<Object?> get props => [request];
}

class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}

class AuthTokenRefreshRequested extends AuthEvent {
  const AuthTokenRefreshRequested();
}

class AuthUpdateProfileRequested extends AuthEvent {
  final String fullName;
  final String? imagePath;

  const AuthUpdateProfileRequested({
    required this.fullName,
    this.imagePath,
  });

  @override
  List<Object?> get props => [fullName, imagePath];
}
