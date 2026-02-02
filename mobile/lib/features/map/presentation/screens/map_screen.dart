import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/station.dart';
import '../../data/repositories/mock_station_repository.dart';
import '../bloc/map_bloc.dart';
import '../../../../core/network/socket_service.dart'; // import if needed for map updates later

class MapScreen extends StatefulWidget {
  const MapScreen({Key? key}) : super(key: key);

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final Completer<GoogleMapController> _controller = Completer();
  
  // San Francisco Default
  static const CameraPosition _kDefaultCenter = CameraPosition(
    target: LatLng(37.7749, -122.4194),
    zoom: 12,
  );

  BitmapDescriptor? _markerIconAvailable;
  BitmapDescriptor? _markerIconBusy;
  BitmapDescriptor? _markerIconOffline;

  @override
  void initState() {
    super.initState();
    _loadMarkerIcons();
  }

  Future<void> _loadMarkerIcons() async {
    // In a real app, load actual assets. Using Hue for now.
    _markerIconAvailable = BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen);
    _markerIconBusy = BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed);
    _markerIconOffline = BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueYellow); // Gray not default available
  }
  
  Set<Marker> _createMarkers(List<Station> stations) {
    return stations.map((station) {
      BitmapDescriptor icon;
      switch (station.status) {
        case StationStatus.available:
          icon = _markerIconAvailable ?? BitmapDescriptor.defaultMarker;
          break;
        case StationStatus.busy:
          icon = _markerIconBusy ?? BitmapDescriptor.defaultMarker;
          break;
        case StationStatus.offline:
          icon = _markerIconOffline ?? BitmapDescriptor.defaultMarker;
          break;
      }

      return Marker(
        markerId: MarkerId(station.id),
        position: LatLng(station.location.latitude, station.location.longitude),
        icon: icon,
        infoWindow: InfoWindow(
          title: station.name,
          snippet: '${station.connectorTypes.join(", ")} - \$${station.pricePerKwh}/m',
          onTap: () {
             _showStationDetails(station);
          },
        ),
        onTap: () {
          // Can also trigger bottom sheet here
          _showStationDetails(station);
        }
      );
    }).toSet();
  }

  void _showStationDetails(Station station) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return _StationDetailSheet(station: station);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Inject Bloc here or assuming it's provided up the tree. 
    // Since I'm creating a standalone feature, I'll provide it locally for this screen.
    return BlocProvider(
      create: (context) => MapBloc(MockStationRepository())..add(LoadMapStations()),
      child: Scaffold(
        body: Stack(
          children: [
            BlocBuilder<MapBloc, MapState>(
              builder: (context, state) {
                Set<Marker> markers = {};
                if (state is MapLoaded) {
                  markers = _createMarkers(state.filteredStations);
                }

                return GoogleMap(
                  mapType: MapType.normal,
                  initialCameraPosition: _kDefaultCenter,
                  markers: markers,
                  onMapCreated: (GoogleMapController controller) {
                    _controller.complete(controller);
                  },
                  myLocationEnabled: true,
                  myLocationButtonEnabled: true,
                );
              },
            ),
            
            // Search / Filter Bar
            Positioned(
              top: 50,
              left: 15,
              right: 15,
              child: Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                child: Padding(
                   padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                   child: Row(
                     children: [
                       const Icon(Icons.search, color: Colors.grey),
                       const SizedBox(width: 10),
                       Expanded(
                         child: TextField(
                           decoration: InputDecoration(
                             border: InputBorder.none,
                             hintText: 'Search chargers...',
                           ),
                         ),
                       ),
                       IconButton(
                         icon: const Icon(Icons.tune),
                         onPressed: () {
                           // Open Filter Dialog
                         },
                       )
                     ],
                   ),
                ),
              ),
            ),

            // Draggable Scrollable Sheet for Station List
            DraggableScrollableSheet(
              initialChildSize: 0.1,
              minChildSize: 0.1,
              maxChildSize: 0.6,
              builder: (context, scrollController) {
                return Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                    boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)],
                  ),
                  child: BlocBuilder<MapBloc, MapState>(
                    builder: (context, state) {
                      if (state is MapLoading) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      if (state is MapLoaded) {
                        return ListView.builder(
                          controller: scrollController,
                          itemCount: state.filteredStations.length + 1, // +1 for header
                          itemBuilder: (context, index) {
                            if (index == 0) {
                              return Center(
                                child: Container(
                                  margin: const EdgeInsets.only(top: 10, bottom: 10),
                                  width: 40,
                                  height: 5,
                                  decoration: BoxDecoration(
                                    color: Colors.grey[300],
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                              );
                            }
                            final station = state.filteredStations[index - 1];
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: _getStatusColor(station.status),
                                child: const Icon(Icons.ev_station, color: Colors.white),
                              ),
                              title: Text(station.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text('${station.address} • ${station.connectorTypes.first}'),
                              trailing: Text('\$${station.pricePerKwh}/kwh'),
                              onTap: () async {
                                final controller = await _controller.future;
                                controller.animateCamera(CameraUpdate.newLatLng(
                                  LatLng(station.location.latitude, station.location.longitude)
                                ));
                                // Trigger detail selection
                                _showStationDetails(station);
                              },
                            );
                          },
                        );
                      }
                      return const Center(child: Text("Simulated Offline Mode"));
                    },
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(StationStatus status) {
    switch(status) {
      case StationStatus.available: return Colors.green;
      case StationStatus.busy: return Colors.red;
      case StationStatus.offline: return Colors.grey;
    }
  }
}

class _StationDetailSheet extends StatelessWidget {
  final Station station;
  const _StationDetailSheet({Key? key, required this.station}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(station.name, style: Theme.of(context).textTheme.headlineSmall),
              Chip(
                label: Text(station.status.name.toUpperCase()),
                backgroundColor: _getStatusColor(station.status).withOpacity(0.1),
                labelStyle: TextStyle(color: _getStatusColor(station.status)),
              )
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.location_on, color: Colors.grey, size: 16),
              const SizedBox(width: 5),
              Text(station.address, style: const TextStyle(color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _DetailIcon(Icons.bolt, "${station.connectorTypes.length} Connectors"),
              _DetailIcon(Icons.speed, "Fast Charge"), // Mocked
              _DetailIcon(Icons.attach_money, "\$${station.pricePerKwh}/kWh"),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green[700],
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () {
                // Navigate to Booking or Charging Flow
                Navigator.pop(context);
                // In real app: Navigator.pushNamed(context, '/charging', arguments: station);
              },
              child: const Text("Naviagte & Charge", style: TextStyle(color: Colors.white, fontSize: 16)),
            ),
          )
        ],
      ),
    );
  }

  Color _getStatusColor(StationStatus status) {
    switch(status) {
      case StationStatus.available: return Colors.green;
      case StationStatus.busy: return Colors.red;
      case StationStatus.offline: return Colors.grey;
    }
  }
}

class _DetailIcon extends StatelessWidget {
  final IconData icon;
  final String label;
  const _DetailIcon(this.icon, this.label);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: Colors.green[700], size: 28),
        const SizedBox(height: 5),
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
