import { Injectable, signal } from '@angular/core';
import { Observable, of, interval } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export type ConnectorType = 'Type 2' | 'CCS' | 'CHAdeMO';

export interface Charger {
  id: string;
  connectorType: ConnectorType;
  status: 'Available' | 'In Use' | 'Offline';
  power: number;
}

export interface Station {
  id: string;
  name: string;
  location: string;
  city: string;
  status: 'Available' | 'In Use' | 'Offline';
  pricePerKwh: number;
  chargers: Charger[];
  latitude?: number;
  longitude?: number;
}

export interface ChargingSession {
  id: string;
  stationId: string;
  chargerId: string;
  startTime: Date;
  soc: number;
  energyDelivered: number;
  totalCost: number;
}

export interface Reservation {
  id: string;
  stationId: string;
  date: string;
  timeSlot: string;
  createdAt: Date;
}

export interface ChargingHistory {
  id: string;
  stationName: string;
  date: string;
  energyDelivered: number;
  cost: number;
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  currentSession = signal<ChargingSession | null>(null);
  reservations = signal<Reservation[]>([
    { id: 'r1', stationId: '1', date: '2025-02-03', timeSlot: '14:00-16:00', createdAt: new Date() },
    { id: 'r2', stationId: '2', date: '2025-02-05', timeSlot: '09:00-11:00', createdAt: new Date() },
  ]);
  chargingHistory = signal<ChargingHistory[]>([
    { id: 'h1', stationName: 'Downtown Charging Hub', date: '2025-02-25', energyDelivered: 45, cost: 15.75 },
    { id: 'h2', stationName: 'Tech Park Station', date: '2025-02-24', energyDelivered: 38, cost: 12.16 },
    { id: 'h3', stationName: 'Shopping Mall Parking', date: '2025-02-23', energyDelivered: 52, cost: 17.16 },
    { id: 'h4', stationName: 'Harbor District Fast Charge', date: '2025-02-22', energyDelivered: 60, cost: 25.20 },
    { id: 'h5', stationName: 'Downtown Charging Hub', date: '2025-02-21', energyDelivered: 42, cost: 14.70 },
  ]);

  private sessionSubscription: any;

  private stations: Station[] = [
    {
      id: '1',
      name: 'Downtown Charging Hub',
      location: '123 Main Street',
      city: 'San Francisco',
      status: 'Available',
      pricePerKwh: 0.35,
      latitude: 37.7749,
      longitude: -122.4194,
      chargers: [
        { id: 'c1', connectorType: 'Type 2', status: 'Available', power: 7 },
        { id: 'c2', connectorType: 'Type 2', status: 'In Use', power: 7 },
        { id: 'c3', connectorType: 'CCS', status: 'Available', power: 50 },
        { id: 'c4', connectorType: 'CHAdeMO', status: 'Offline', power: 50 }
      ]
    },
    {
      id: '2',
      name: 'Tech Park Station',
      location: '456 Innovation Drive',
      city: 'San Francisco',
      status: 'Available',
      pricePerKwh: 0.32,
      latitude: 37.4419,
      longitude: -122.1430,
      chargers: [
        { id: 'c5', connectorType: 'Type 2', status: 'Available', power: 11 },
        { id: 'c6', connectorType: 'Type 2', status: 'Available', power: 11 },
        { id: 'c7', connectorType: 'CCS', status: 'Available', power: 150 }
      ]
    },
    {
      id: '3',
      name: 'Airport Terminal Charging',
      location: '100 Hangars Way',
      city: 'San Francisco',
      status: 'In Use',
      pricePerKwh: 0.45,
      latitude: 37.6213,
      longitude: -122.3790,
      chargers: [
        { id: 'c8', connectorType: 'CCS', status: 'In Use', power: 100 },
        { id: 'c9', connectorType: 'CCS', status: 'In Use', power: 100 },
        { id: 'c10', connectorType: 'CHAdeMO', status: 'In Use', power: 50 }
      ]
    },
    {
      id: '4',
      name: 'Beachside Energy Station',
      location: '789 Ocean Boulevard',
      city: 'Santa Cruz',
      status: 'Available',
      pricePerKwh: 0.38,
      latitude: 36.9741,
      longitude: -122.0891,
      chargers: [
        { id: 'c11', connectorType: 'Type 2', status: 'Available', power: 7 },
        { id: 'c12', connectorType: 'CCS', status: 'Available', power: 75 }
      ]
    },
    {
      id: '5',
      name: 'Mountain Pass Rest Area',
      location: '321 Summit Road',
      city: 'Los Gatos',
      status: 'Offline',
      pricePerKwh: 0.40,
      latitude: 37.2338,
      longitude: -121.9623,
      chargers: [
        { id: 'c13', connectorType: 'Type 2', status: 'Offline', power: 7 },
        { id: 'c14', connectorType: 'CCS', status: 'Offline', power: 50 }
      ]
    },
    {
      id: '6',
      name: 'Harbor District Fast Charge',
      location: '555 Portside Avenue',
      city: 'Oakland',
      status: 'Available',
      pricePerKwh: 0.42,
      latitude: 37.8044,
      longitude: -122.2712,
      chargers: [
        { id: 'c15', connectorType: 'CCS', status: 'Available', power: 200 },
        { id: 'c16', connectorType: 'CHAdeMO', status: 'Available', power: 50 },
        { id: 'c17', connectorType: 'Type 2', status: 'In Use', power: 11 }
      ]
    },
    {
      id: '7',
      name: 'Shopping Mall Parking',
      location: '888 Retail Way',
      city: 'San Jose',
      status: 'Available',
      pricePerKwh: 0.33,
      latitude: 37.3382,
      longitude: -121.8863,
      chargers: [
        { id: 'c18', connectorType: 'Type 2', status: 'Available', power: 7 },
        { id: 'c19', connectorType: 'Type 2', status: 'Available', power: 7 },
        { id: 'c20', connectorType: 'Type 2', status: 'Available', power: 7 }
      ]
    },
    {
      id: '8',
      name: 'University Campus EV Hub',
      location: '2000 Academic Lane',
      city: 'Berkeley',
      status: 'Available',
      pricePerKwh: 0.31,
      latitude: 37.8715,
      longitude: -122.2593,
      chargers: [
        { id: 'c21', connectorType: 'Type 2', status: 'Available', power: 7 },
        { id: 'c22', connectorType: 'Type 2', status: 'Available', power: 7 },
        { id: 'c23', connectorType: 'CCS', status: 'Available', power: 100 }
      ]
    }
  ];

  constructor() {}

  getStations(): Observable<Station[]> {
    return of(this.stations).pipe(delay(300));
  }

  getStationById(id: string): Observable<Station | undefined> {
    return of(this.stations.find(s => s.id === id)).pipe(delay(300));
  }

  startSession(stationId: string, chargerId: string): void {
    if (this.currentSession()) {
      return;
    }

    const session: ChargingSession = {
      id: 'session_' + Date.now(),
      stationId,
      chargerId,
      startTime: new Date(),
      soc: 20,
      energyDelivered: 0,
      totalCost: 0,
    };

    this.currentSession.set(session);

    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
    }

    this.sessionSubscription = interval(1000).subscribe(() => {
      const current = this.currentSession();
      if (current) {
        const station = this.stations.find(s => s.id === current.stationId);
        const charger = station?.chargers.find(c => c.id === current.chargerId);
        const powerKw = charger?.power || 7;

        const newSession = { ...current };
        newSession.soc = Math.min(100, newSession.soc + 0.5);
        newSession.energyDelivered += powerKw / 3600;

        const station_data = this.stations.find(s => s.id === current.stationId);
        newSession.totalCost = newSession.energyDelivered * (station_data?.pricePerKwh || 0.35);

        this.currentSession.set(newSession);

        if (newSession.soc >= 100) {
          this.endSession();
        }
      }
    });
  }

  endSession(): void {
    const current = this.currentSession();
    if (current) {
      const station = this.stations.find(s => s.id === current.stationId);
      this.chargingHistory.update(history => [
        {
          id: 'h_' + Date.now(),
          stationName: station?.name || 'Unknown',
          date: new Date().toISOString().split('T')[0],
          energyDelivered: Math.round(current.energyDelivered * 100) / 100,
          cost: Math.round(current.totalCost * 100) / 100,
        },
        ...history,
      ]);
    }

    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
    }

    this.currentSession.set(null);
  }


  getChargingHistory(): Observable<ChargingHistory[]> {
    return of(this.chargingHistory()).pipe(delay(200));
  }

  getTotalStats() {
    const history = this.chargingHistory();
    const totalEnergy = history.reduce((sum, h) => sum + h.energyDelivered, 0);
    const totalSpend = history.reduce((sum, h) => sum + h.cost, 0);
    const sessionsThisMonth = history.length;

    return {
      totalEnergy: Math.round(totalEnergy * 100) / 100,
      totalSpend: Math.round(totalSpend * 100) / 100,
      sessionsThisMonth,
    };
  }

  getReservations(): Observable<Reservation[]> {
    return of(this.reservations()).pipe(delay(200));
  }

  getActiveSession(): any {
    const session = this.currentSession();
    if (!session) return null;
    const station = this.stations.find(s => s.id === session.stationId);
    const charger = station?.chargers.find(c => c.id === session.chargerId);
    return {
      id: session.id,
      stationName: station?.name || 'Unknown Station',
      chargerId: session.chargerId,
      energyDelivered: session.energyDelivered,
      totalCost: session.totalCost,
      chargingRate: charger?.power || 7,
      startTime: session.startTime,
      pricePerKwh: station?.pricePerKwh || 0.35,
      socPercent: Math.round(session.soc)
    };
  }

  stopSession(): void {
    this.endSession();
  }

  getReservationsSync(): any[] {
    return this.reservations();
  }

  addReservation(reservation: any): void {
    this.reservations.update(reservations => [
      ...reservations,
      {
        id: reservation.id,
        stationId: '1',
        date: reservation.date,
        timeSlot: reservation.timeSlot,
        createdAt: new Date()
      }
    ]);
  }

  cancelReservation(id: string): void {
    this.reservations.update(reservations =>
      reservations.filter(r => r.id !== id)
    );
  }

  getChargingSessions(): any[] {
    return this.chargingHistory().map(h => ({
      id: h.id,
      stationName: h.stationName,
      date: h.date,
      energy: h.energyDelivered,
      cost: h.cost
    }));
  }
}
