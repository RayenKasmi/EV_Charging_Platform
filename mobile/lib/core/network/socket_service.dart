// ignore_for_file: library_prefixes

import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:injectable/injectable.dart';

@lazySingleton
class SocketService with WidgetsBindingObserver {
  late IO.Socket _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  SocketService() {
    WidgetsBinding.instance.addObserver(this);
    initSocket();
  }

  void initSocket() {
    // Replace with your actual backend URL
    const String backendUrl = 'http://10.0.2.2:3000'; // Android Simulator localhost

    _socket = IO.io(backendUrl, IO.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect() // We connect manually
        .build());

    _socket.onConnect((_) {
      debugPrint('Socket Connected');
      _isConnected = true;
    });

    _socket.onDisconnect((_) {
      debugPrint('Socket Disconnected');
      _isConnected = false;
    });

    _socket.onError((data) => debugPrint('Socket Error: $data'));
  }

  void connect() {
    if (!_socket.connected) {
      _socket.connect();
    }
  }

  void disconnect() {
    if (_socket.connected) {
      _socket.disconnect();
    }
  }

  void on(String event, Function(dynamic) handler) {
    _socket.on(event, handler);
  }

  void off(String event) {
    _socket.off(event);
  }

  void emit(String event, [dynamic data]) {
    _socket.emit(event, data);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Battery Efficiency: Disconnect when in background
    if (state == AppLifecycleState.paused) {
      disconnect();
    } else if (state == AppLifecycleState.resumed) {
      connect();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    disconnect();
    _socket.dispose();
  }
}
