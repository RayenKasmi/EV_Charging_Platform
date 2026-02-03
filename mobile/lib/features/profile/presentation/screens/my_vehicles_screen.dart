import 'package:flutter/material.dart';

class Vehicle {
  final String name;
  final String model;
  final String color;
  final String datePurchased;

  const Vehicle({
    required this.name,
    required this.model,
    required this.color,
    required this.datePurchased,
  });
}

class MyVehiclesScreen extends StatelessWidget {
  const MyVehiclesScreen({Key? key}) : super(key: key);

  final List<Vehicle> _mockVehicles = const [
    Vehicle(
      name: "Tesla Model 3",
      model: "Long Range AWD",
      color: "Pearl White",
      datePurchased: "2023-05-12",
    )
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Vehicles'),
        centerTitle: true,
      ),
      body: _mockVehicles.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                   Icon(Icons.no_crash_outlined, size: 80, color: theme.colorScheme.outline),
                   const SizedBox(height: 16),
                   Text(
                     "No vehicles added yet",
                     style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                   ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _mockVehicles.length,
              itemBuilder: (context, index) {
                final vehicle = _mockVehicles[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _VehicleCard(vehicle: vehicle),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Add Vehicle feature coming soon!")),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _VehicleCard extends StatelessWidget {
  final Vehicle vehicle;

  const _VehicleCard({required this.vehicle});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      color: theme.colorScheme.surface,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            // Icon
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer.withOpacity(0.3),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.electric_car_rounded,
                size: 48,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 16),
            
            // Name
            Text(
              vehicle.name,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            
            // Model
            Text(
              vehicle.model,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            
            const SizedBox(height: 20),
            const Divider(),
            const SizedBox(height: 10),

            // Details Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildInfoColumn(context, "Color", vehicle.color, Icons.palette_outlined),
                _buildInfoColumn(context, "Purchased", vehicle.datePurchased, Icons.calendar_today_outlined),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoColumn(BuildContext context, String label, String value, IconData icon) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Icon(icon, size: 16, color: theme.colorScheme.onSurfaceVariant),
        const SizedBox(height: 4),
        Text(
          value,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}
