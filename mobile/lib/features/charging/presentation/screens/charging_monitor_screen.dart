import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../bloc/charging_bloc.dart';
import '../../domain/entities/charging_session.dart';
import '../../../../core/network/socket_service.dart';

class ChargingMonitorScreen extends StatelessWidget {
  const ChargingMonitorScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Inject dependencies. Ideally done via DI (get_it)
    return BlocProvider(
      create: (context) => ChargingBloc(SocketService()), 
      child: const ChargingView(),
    );
  }
}

class ChargingView extends StatefulWidget {
  const ChargingView({Key? key}) : super(key: key);

  @override
  State<ChargingView> createState() => _ChargingViewState();
}

class _ChargingViewState extends State<ChargingView> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Charging Session'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: BlocBuilder<ChargingBloc, ChargingState>(
        builder: (context, state) {
          if (state is ChargingInitial) {
            return _buildStartScreen(context);
          } else if (state is ChargingConnecting) {
             return const Center(child: CircularProgressIndicator());
          } else if (state is ChargingActive) {
            return _buildDashboard(context, state.session);
          } else if (state is ChargingCompleted) {
            return _buildSummary(context, state.finalSession);
          }
           return Container();
        },
      ),
    );
  }

  Widget _buildStartScreen(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.ev_station, size: 80, color: theme.colorScheme.primary),
          const SizedBox(height: 20),
          const Text(
            "Ready to Charge?",
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          Text(
            "Scan the QR code on the charger or enter the ID manually.",
            textAlign: TextAlign.center,
            style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 40),
          ElevatedButton.icon(
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text("Scan QR Code"),
            style: ElevatedButton.styleFrom(
              backgroundColor: theme.colorScheme.primary,
              foregroundColor: theme.colorScheme.onPrimary,
              minimumSize: const Size(double.infinity, 50),
            ),
            onPressed: () {
               _showQRScanner(context);
            },
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            child: const Text("Enter Manual ID"),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 50),
            ),
            onPressed: () {
              _showManualIdDialog(context);
            },
          )
        ],
      ),
    );
  }

  void _showManualIdDialog(BuildContext context) {
    final TextEditingController controller = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text("Enter Manual ID"),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              hintText: "Enter Charger ID",
              labelText: "Charger ID"
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                if (controller.text.isNotEmpty) {
                  Navigator.pop(dialogContext);
                  context.read<ChargingBloc>().add(StartChargingSession(chargerId: controller.text));
                }
              },
              child: const Text("Start"),
            ),
          ],
        );
      },
    );
  }

  void _showQRScanner(BuildContext context) {
    // Capture the bloc to ensure we use the correct one
    final chargingBloc = context.read<ChargingBloc>();
    
    Navigator.of(context).push(MaterialPageRoute(
      builder: (ctx) => Scaffold(
        appBar: AppBar(title: const Text("Scan QR")),
        body: MobileScanner(
          onDetect: (capture) {
            final List<Barcode> barcodes = capture.barcodes;
            for (final barcode in barcodes) {
              if (barcode.rawValue != null) {
                // Found a code
                Navigator.pop(ctx);
                chargingBloc.add(StartChargingSession(chargerId: barcode.rawValue!));
                break;
              }
            }
          },
        ),
      ),
    ));
  }

  Widget _buildDashboard(BuildContext context, ChargingSession session) {
    final theme = Theme.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Text(session.stationName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
          Text("Session ID: ${session.sessionId}", style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 30),
          _buildGauge(context, session.soc),
          const SizedBox(height: 40),
          _buildMetricsGrid(session),
          const SizedBox(height: 40),
          ElevatedButton(
            onPressed: () {
               context.read<ChargingBloc>().add(StopChargingSession());
            }, 
            style: ElevatedButton.styleFrom(
              backgroundColor: theme.colorScheme.errorContainer,
              foregroundColor: theme.colorScheme.onErrorContainer,
              minimumSize: const Size(double.infinity, 50),
              elevation: 0,
            ),
            child: const Text("Stop Charging")
          )
        ],
      ),
    );
  }

  Widget _buildGauge(BuildContext context, int soc) {
    final theme = Theme.of(context);
    return Stack(
      alignment: Alignment.center,
      children: [
        SizedBox(
          height: 200,
          width: 200,
          child: CircularProgressIndicator(
            value: soc / 100,
            strokeWidth: 20,
            backgroundColor: theme.colorScheme.surfaceVariant,
            valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.primary),
          ),
        ),
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("$soc%", style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold)),
             Text("SoC", style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
          ],
        )
      ],
    );
  }

  Widget _buildMetricsGrid(ChargingSession session) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 15,
      mainAxisSpacing: 15,
      childAspectRatio: 1.5,
      children: [
        _MetricCard(
          icon: Icons.flash_on, 
          value: "${session.currentPowerKw.toStringAsFixed(1)} kW", 
          label: "Live Power"
        ),
        _MetricCard(
          icon: Icons.battery_charging_full, 
          value: "${session.energyDeliveredKwh.toStringAsFixed(2)} kWh", 
          label: "Energy Delivered"
        ),
        _MetricCard(
          icon: Icons.timer, 
          value: _formatDuration(session.timeElapsedSeconds), 
          label: "Duration"
        ),
        _MetricCard(
          icon: Icons.attach_money, 
          value: "\$${session.currentCost.toStringAsFixed(2)}", 
          label: "Current Cost",
          isHighLight: true,
        ),
      ],
    );
  }

  String _formatDuration(int seconds) {
    final d = Duration(seconds: seconds);
    return "${d.inMinutes.remainder(60).toString().padLeft(2, '0')}:${d.inSeconds.remainder(60).toString().padLeft(2, '0')}";
  }

  Widget _buildSummary(BuildContext context, ChargingSession session) {
    final theme = Theme.of(context);
     return Center(
       child: Column(
         mainAxisAlignment: MainAxisAlignment.center,
         children: [
           Icon(Icons.check_circle, size: 80, color: theme.colorScheme.primary),
           const SizedBox(height: 20),
           const Text("Charging Complete", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
           const SizedBox(height: 20),
           Text("Total Cost: \$${session.currentCost.toStringAsFixed(2)}", style: const TextStyle(fontSize: 18)),
            Text("Energy: ${session.energyDeliveredKwh.toStringAsFixed(2)} kWh"),
            const SizedBox(height: 40),
            ElevatedButton(
              onPressed: () {
                // Reset to home or initial
                context.read<ChargingBloc>().add(StopChargingSession()); // Already stopped, but resets state logic
              },
              child: const Text("Done")
            )
         ],
       ),
     );
  }
}

class _MetricCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final bool isHighLight;

  const _MetricCard({
    required this.icon, 
    required this.value, 
    required this.label,
    this.isHighLight = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(15),
        boxShadow: theme.brightness == Brightness.light ? [
          BoxShadow(
            color: theme.colorScheme.primary.withOpacity(0.1),
            offset: const Offset(0, 4),
            blurRadius: 10,
          )
        ] : null,
        border: isHighLight ? Border.all(color: theme.colorScheme.primary, width: 2) : Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: isHighLight ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isHighLight ? theme.colorScheme.primary : theme.colorScheme.onSurface)),
          Text(label, style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}
