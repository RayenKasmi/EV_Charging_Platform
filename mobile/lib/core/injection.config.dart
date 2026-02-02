// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// InjectableConfigGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:dio/dio.dart' as _i361;
import 'package:flutter_secure_storage/flutter_secure_storage.dart' as _i558;
import 'package:get_it/get_it.dart' as _i174;
import 'package:injectable/injectable.dart' as _i526;

import '../features/auth/data/datasources/auth_api_service.dart' as _i384;
import '../features/auth/data/repositories/auth_repository.dart' as _i243;
import '../features/auth/presentation/bloc/auth_bloc.dart' as _i59;
import '../features/charging/presentation/bloc/charging_bloc.dart' as _i371;
import '../features/map/data/repositories/mock_station_repository.dart'
    as _i614;
import '../features/map/domain/repositories/station_repository.dart' as _i305;
import '../features/map/presentation/bloc/map_bloc.dart' as _i703;
import 'injection.dart' as _i464;
import 'network/auth_interceptor.dart' as _i426;
import 'network/socket_service.dart' as _i897;
import 'services/secure_storage_service.dart' as _i363;

extension GetItInjectableX on _i174.GetIt {
// initializes the registration of main-scope dependencies inside of GetIt
  _i174.GetIt init({
    String? environment,
    _i526.EnvironmentFilter? environmentFilter,
  }) {
    final gh = _i526.GetItHelper(
      this,
      environment,
      environmentFilter,
    );
    final registerModule = _$RegisterModule();
    gh.singleton<_i558.FlutterSecureStorage>(
        () => registerModule.secureStorage);
    gh.lazySingleton<_i361.Dio>(() => registerModule.dio);
    gh.lazySingleton<_i897.SocketService>(() => _i897.SocketService());
    gh.factory<_i371.ChargingBloc>(
        () => _i371.ChargingBloc(gh<_i897.SocketService>()));
    gh.singleton<_i361.Dio>(
      () => registerModule.authDio,
      instanceName: 'authDio',
    );
    gh.lazySingleton<_i384.AuthApiService>(
        () => _i384.AuthApiService(gh<_i361.Dio>()));
    gh.singleton<_i363.SecureStorageService>(
        () => _i363.SecureStorageService(gh<_i558.FlutterSecureStorage>()));
    gh.lazySingleton<_i305.StationRepository>(
        () => _i614.MockStationRepository());
    gh.singleton<_i426.AuthInterceptor>(() => _i426.AuthInterceptor(
          gh<_i363.SecureStorageService>(),
          gh<_i361.Dio>(instanceName: 'authDio'),
        ));
    gh.factory<_i703.MapBloc>(
        () => _i703.MapBloc(gh<_i305.StationRepository>()));
    gh.singleton<_i243.AuthRepository>(() => _i243.AuthRepository(
          gh<_i384.AuthApiService>(),
          gh<_i363.SecureStorageService>(),
        ));
    gh.singleton<_i59.AuthBloc>(
        () => _i59.AuthBloc(gh<_i243.AuthRepository>()));
    return this;
  }
}

class _$RegisterModule extends _i464.RegisterModule {}
