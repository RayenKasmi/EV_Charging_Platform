import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  Reservation,
  CreateReservationData,
  Station,
  Charger,
  TimeRange,
  ReservationStatus
} from '../models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private reservations = signal<Reservation[]>([
    {
      id: 'res-001',
      userId: '1',
      stationId: '1',
      chargerId: 'c1',
      startTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
      status: 'CONFIRMED',
      estimatedCost: 14.0,
      stationName: 'Downtown Charging Hub',
      chargerType: 'Type 2',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      id: 'res-002',
      userId: '1',
      stationId: '2',
      chargerId: 'c5',
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 50 * 60 * 60 * 1000),
      status: 'PENDING',
      estimatedCost: 7.04,
      stationName: 'Tech Park Station',
      chargerType: 'Type 2',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'res-003',
      userId: '1',
      stationId: '3',
      chargerId: 'c8',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 22 * 60 * 60 * 1000),
      status: 'COMPLETED',
      estimatedCost: 9.0,
      stationName: 'Airport Terminal Charging',
      chargerType: 'CCS',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    }
  ]);

  private mockStations: Station[] = [
    {
      id: '1',
      name: 'Downtown Charging Hub',
      location: '123 Main Street',
      chargers: [
        { id: 'c1', type: 'Type 2', powerOutput: 7, hourlyRate: 7.0, status: 'Available' },
        { id: 'c2', type: 'Type 2', powerOutput: 7, hourlyRate: 7.0, status: 'In Use' },
        { id: 'c3', type: 'CCS', powerOutput: 50, hourlyRate: 25.0, status: 'Available' },
        { id: 'c4', type: 'CHAdeMO', powerOutput: 50, hourlyRate: 25.0, status: 'Available' }
      ]
    },
    {
      id: '2',
      name: 'Tech Park Station',
      location: '456 Innovation Drive',
      chargers: [
        { id: 'c5', type: 'Type 2', powerOutput: 11, hourlyRate: 3.52, status: 'Available' },
        { id: 'c6', type: 'Type 2', powerOutput: 11, hourlyRate: 3.52, status: 'Available' },
        { id: 'c7', type: 'CCS', powerOutput: 150, hourlyRate: 48.0, status: 'Available' }
      ]
    },
    {
      id: '3',
      name: 'Airport Terminal Charging',
      location: '100 Hangars Way',
      chargers: [
        { id: 'c8', type: 'CCS', powerOutput: 100, hourlyRate: 45.0, status: 'Available' },
        { id: 'c9', type: 'CCS', powerOutput: 100, hourlyRate: 45.0, status: 'In Use' },
        { id: 'c10', type: 'CHAdeMO', powerOutput: 50, hourlyRate: 22.5, status: 'Available' }
      ]
    }
  ];

  getReservations(userId: string): Observable<Reservation[]> {
    return of(this.reservations().filter(r => r.userId === userId)).pipe(delay(300));
  }

  createReservation(data: CreateReservationData): Observable<Reservation> {
    const station = this.mockStations.find(s => s.id === data.stationId);
    const charger = station?.chargers.find(c => c.id === data.chargerId);

    if (!station || !charger) {
      return throwError(() => new Error('Station or charger not found')).pipe(delay(300));
    }

    const durationHours = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60 * 60);
    const estimatedCost = durationHours * charger.hourlyRate;

    const newReservation: Reservation = {
      id: `res-${Date.now()}`,
      userId: '1',
      stationId: data.stationId,
      chargerId: data.chargerId,
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'PENDING',
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      stationName: station.name,
      chargerType: charger.type,
      createdAt: new Date()
    };

    this.reservations.update(reservations => [...reservations, newReservation]);

    return of(newReservation).pipe(delay(500));
  }

  cancelReservation(id: string): Observable<boolean> {
    const reservation = this.reservations().find(r => r.id === id);

    if (!reservation) {
      return throwError(() => new Error('Reservation not found')).pipe(delay(300));
    }

    if (reservation.status === 'ACTIVE' || reservation.status === 'COMPLETED') {
      return throwError(() => new Error('Cannot cancel active or completed reservation')).pipe(delay(300));
    }

    this.reservations.update(reservations =>
      reservations.map(r => r.id === id ? { ...r, status: 'CANCELLED' as ReservationStatus } : r)
    );

    return of(true).pipe(delay(500));
  }

  checkAvailability(stationId: string, timeRange: TimeRange): Observable<Charger[]> {
    const station = this.mockStations.find(s => s.id === stationId);

    if (!station) {
      return throwError(() => new Error('Station not found')).pipe(delay(300));
    }

    const conflictingReservations = this.reservations().filter(r =>
      r.stationId === stationId &&
      r.status !== 'CANCELLED' &&
      r.status !== 'COMPLETED' &&
      this.timeRangesOverlap(
        { start: r.startTime, end: r.endTime },
        timeRange
      )
    );

    const unavailableChargerIds = new Set(conflictingReservations.map(r => r.chargerId));
    const availableChargers = station.chargers.filter(c => !unavailableChargerIds.has(c.id));

    return of(availableChargers).pipe(delay(400));
  }

  validateConflict(stationId: string, startTime: Date, endTime: Date, excludeReservationId?: string): Observable<boolean> {
    const conflictingReservations = this.reservations().filter(r =>
      r.stationId === stationId &&
      r.status !== 'CANCELLED' &&
      r.status !== 'COMPLETED' &&
      r.id !== excludeReservationId &&
      this.timeRangesOverlap(
        { start: r.startTime, end: r.endTime },
        { start: startTime, end: endTime }
      )
    );

    return of(conflictingReservations.length > 0).pipe(delay(300));
  }

  getStations(): Observable<Station[]> {
    return of(this.mockStations).pipe(delay(200));
  }

  getStationById(id: string): Observable<Station | undefined> {
    return of(this.mockStations.find(s => s.id === id)).pipe(delay(200));
  }

  calculateEstimatedCost(chargerId: string, stationId: string, startTime: Date, endTime: Date): number {
    const station = this.mockStations.find(s => s.id === stationId);
    const charger = station?.chargers.find(c => c.id === chargerId);

    if (!charger) return 0;

    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return Math.round(durationHours * charger.hourlyRate * 100) / 100;
  }

  getReservationsByStationAndDate(stationId: string, date: Date): Observable<Reservation[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const filtered = this.reservations().filter(r =>
      r.stationId === stationId &&
      r.status !== 'CANCELLED' &&
      (
        (r.startTime >= startOfDay && r.startTime <= endOfDay) ||
        (r.endTime >= startOfDay && r.endTime <= endOfDay) ||
        (r.startTime < startOfDay && r.endTime > endOfDay)
      )
    );

    return of(filtered).pipe(delay(300));
  }

  private timeRangesOverlap(range1: TimeRange, range2: TimeRange): boolean {
    return range1.start < range2.end && range2.start < range1.end;
  }
}
