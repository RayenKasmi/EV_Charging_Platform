import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, filter } from 'rxjs/operators';
import {
  User,
  UserRole,
  AuthResponse,
  Station,
  StationStatus,
  ChargerType,
  ChargerStatus,
  ConnectorType,
  Charger,
  Location,
  Reservation,
  ReservationStatus,
  TargetSoC,
  ChargingSession,
  SessionStatus,
  PricingRule,
  PricingRuleType,
  QueuePosition,
  QueuePriorityTier,
  RevenueData,
  UtilizationData,
  UserBehaviorData,
  AnalyticsPeriod,
  PriceUpdate,
  SessionUpdate,
  QueueUpdate,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class DummyDataService {
  // Mock users
  private readonly mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      phone: '+1234567890',
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date(),
    },
    {
      id: '2',
      email: 'operator@example.com',
      firstName: 'Operator',
      lastName: 'User',
      role: UserRole.OPERATOR,
      phone: '+1234567891',
      createdAt: new Date('2024-01-02'),
      lastLogin: new Date(),
    },
    {
      id: '3',
      email: 'driver@example.com',
      firstName: 'Driver',
      lastName: 'User',
      role: UserRole.DRIVER,
      phone: '+1234567892',
      createdAt: new Date('2024-01-03'),
      lastLogin: new Date(),
    },
  ];

  // Mock stations
  private readonly mockStations: Station[] = this.generateMockStations();

  // Mock chargers
  private readonly mockChargers: Charger[] = this.generateMockChargers();

  // Mock reservations
  private readonly mockReservations: Reservation[] = this.generateMockReservations();

  // Mock sessions
  private readonly mockSessions: ChargingSession[] = this.generateMockSessions();

  // Real-time update subjects
  private priceUpdateSubject = new BehaviorSubject<PriceUpdate | null>(null);
  private sessionUpdateSubject = new BehaviorSubject<SessionUpdate | null>(null);
  private queueUpdateSubject = new BehaviorSubject<QueueUpdate | null>(null);

  constructor() {
    this.initializeRealTimeUpdates();
  }

  // ==================== USER METHODS ====================

  /**
   * Get all users
   */
  getUsers(): Observable<User[]> {
    return of(this.mockUsers).pipe(delay(500));
  }

  /**
   * Get current user (for authenticated user)
   */
  getCurrentUser(email: string): Observable<User | undefined> {
    const user = this.mockUsers.find((u) => u.email === email);
    return of(user).pipe(delay(300));
  }

  /**
   * Login user
   */
  login(email: string, password: string): Observable<AuthResponse> {
    // Simulate authentication delay
    const user = this.mockUsers.find((u) => u.email === email);
    if (user) {
      return of({
        accessToken: `token_${user.id}_${Date.now()}`,
        refreshToken: `refresh_${user.id}_${Date.now()}`,
        user,
      }).pipe(delay(700));
    }
    throw new Error('Invalid credentials');
  }

  /**
   * Register new user
   */
  register(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Observable<AuthResponse> {
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      firstName,
      lastName,
      role: UserRole.DRIVER,
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    return of({
      accessToken: `token_${newUser.id}_${Date.now()}`,
      refreshToken: `refresh_${newUser.id}_${Date.now()}`,
      user: newUser,
    }).pipe(delay(800));
  }

  // ==================== STATION METHODS ====================

  /**
   * Get all stations
   */
  getStations(): Observable<Station[]> {
    return of(this.mockStations).pipe(delay(600));
  }

  /**
   * Get station by ID
   */
  getStationById(id: string): Observable<Station | undefined> {
    const station = this.mockStations.find((s) => s.id === id);
    return of(station).pipe(delay(400));
  }

  /**
   * Create new station
   */
  createStation(stationData: any): Observable<Station> {
    const newStation: Station = {
      id: `station_${Date.now()}`,
      ...stationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockStations.push(newStation);
    return of(newStation).pipe(delay(800));
  }

  /**
   * Update station
   */
  updateStation(id: string, stationData: any): Observable<Station> {
    const station = this.mockStations.find((s) => s.id === id);
    if (station) {
      const updated = { ...station, ...stationData, updatedAt: new Date() };
      const index = this.mockStations.findIndex((s) => s.id === id);
      this.mockStations[index] = updated;
      return of(updated).pipe(delay(700));
    }
    throw new Error('Station not found');
  }

  /**
   * Delete station
   */
  deleteStation(id: string): Observable<void> {
    const index = this.mockStations.findIndex((s) => s.id === id);
    if (index >= 0) {
      this.mockStations.splice(index, 1);
      return of(undefined).pipe(delay(600));
    }
    throw new Error('Station not found');
  }

  // ==================== CHARGER METHODS ====================

  /**
   * Get chargers by station
   */
  getChargersByStation(stationId: string): Observable<Charger[]> {
    const chargers = this.mockChargers.filter((c) => c.stationId === stationId);
    return of(chargers).pipe(delay(400));
  }

  /**
   * Get charger by ID
   */
  getChargerById(id: string): Observable<Charger | undefined> {
    const charger = this.mockChargers.find((c) => c.id === id);
    return of(charger).pipe(delay(300));
  }

  // ==================== RESERVATION METHODS ====================

  /**
   * Get all reservations
   */
  getReservations(): Observable<Reservation[]> {
    return of(this.mockReservations).pipe(delay(500));
  }

  /**
   * Get reservations by user
   */
  getReservationsByUser(userId: string): Observable<Reservation[]> {
    const reservations = this.mockReservations.filter(
      (r) => r.userId === userId
    );
    return of(reservations).pipe(delay(450));
  }

  /**
   * Create reservation
   */
  createReservation(data: any): Observable<Reservation> {
    const newReservation: Reservation = {
      id: `reservation_${Date.now()}`,
      ...data,
      status: ReservationStatus.CONFIRMED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockReservations.push(newReservation);
    return of(newReservation).pipe(delay(700));
  }

  /**
   * Cancel reservation
   */
  cancelReservation(id: string): Observable<void> {
    const reservation = this.mockReservations.find((r) => r.id === id);
    if (reservation) {
      reservation.status = ReservationStatus.CANCELLED;
      reservation.updatedAt = new Date();
      return of(undefined).pipe(delay(600));
    }
    throw new Error('Reservation not found');
  }

  // ==================== SESSION METHODS ====================

  /**
   * Get all sessions
   */
  getSessions(): Observable<ChargingSession[]> {
    return of(this.mockSessions).pipe(delay(500));
  }

  /**
   * Get active session
   */
  getActiveSession(userId: string): Observable<ChargingSession | null> {
    const session = this.mockSessions.find(
      (s) => s.userId === userId && s.status === SessionStatus.ACTIVE
    );
    return of(session || null).pipe(delay(400));
  }

  /**
   * Start charging session
   */
  startSession(data: any): Observable<ChargingSession> {
    const newSession: ChargingSession = {
      id: `session_${Date.now()}`,
      ...data,
      status: SessionStatus.ACTIVE,
      energyDelivered: 0,
      totalCost: 0,
      currentSoC: 10,
      startTime: new Date(),
      createdAt: new Date(),
    };

    this.mockSessions.push(newSession);
    return of(newSession).pipe(delay(800));
  }

  /**
   * Stop charging session
   */
  stopSession(id: string): Observable<ChargingSession> {
    const session = this.mockSessions.find((s) => s.id === id);
    if (session) {
      session.status = SessionStatus.COMPLETED;
      session.endTime = new Date();
      return of(session).pipe(delay(700));
    }
    throw new Error('Session not found');
  }

  // ==================== REAL-TIME UPDATE METHODS ====================

  /**
   * Get session updates (real-time)
   */
  getSessionUpdates(sessionId: string): Observable<SessionUpdate> {
    return this.sessionUpdateSubject.asObservable().pipe(
      filter((update) => update !== null && update.sessionId === sessionId),
      map((update) => update as SessionUpdate)
    );
  }

  /**
   * Get price updates (real-time)
   */
  getPriceUpdates(stationId: string): Observable<PriceUpdate> {
    return this.priceUpdateSubject.asObservable().pipe(
      filter((update) => update !== null && update.stationId === stationId),
      map((update) => update as PriceUpdate)
    );
  }

  /**
   * Get queue updates (real-time)
   */
  getQueueUpdates(stationId: string): Observable<QueueUpdate> {
    return this.queueUpdateSubject.asObservable().pipe(
      filter((update) => update !== null && update.stationId === stationId),
      map((update) => update as QueueUpdate)
    );
  }

  // ==================== PRICING METHODS ====================

  /**
   * Get pricing rules by station
   */
  getPricingRules(stationId: string): Observable<PricingRule[]> {
    const rules = this.generateMockPricingRules(stationId);
    return of(rules).pipe(delay(500));
  }

  /**
   * Get current price
   */
  getCurrentPrice(stationId: string): Observable<number> {
    const basePrice = 0.35;
    const variation = Math.random() * 0.15;
    return of(basePrice + variation).pipe(delay(200));
  }

  /**
   * Get price forecast
   */
  getPriceForecast(stationId: string): Observable<any[]> {
    const forecast = [];
    for (let i = 0; i < 24; i++) {
      const hour = new Date();
      hour.setHours(hour.getHours() + i);
      forecast.push({
        timestamp: hour,
        expectedPrice: 0.3 + Math.random() * 0.2,
        gridLoadForecast: 40 + Math.random() * 40,
        renewableEnergyForecast: 30 + Math.random() * 50,
      });
    }
    return of(forecast).pipe(delay(500));
  }

  // ==================== QUEUE METHODS ====================

  /**
   * Get queue status
   */
  getQueueStatus(stationId: string): Observable<any> {
    return of({
      stationId,
      totalInQueue: Math.floor(Math.random() * 10),
      averageWaitTime: Math.floor(Math.random() * 30) + 5,
      priorityDistribution: {
        standard: Math.floor(Math.random() * 8),
        premium: Math.floor(Math.random() * 4),
        vip: Math.floor(Math.random() * 2),
      },
    }).pipe(delay(400));
  }

  /**
   * Join queue
   */
  joinQueue(stationId: string, userId: string): Observable<QueuePosition> {
    const position: QueuePosition = {
      id: `queue_${Date.now()}`,
      queueId: `q_${stationId}`,
      userId,
      stationId,
      position: Math.floor(Math.random() * 10) + 1,
      priorityTier: QueuePriorityTier.STANDARD,
      status: 'WAITING' as any,
      estimatedWaitTime: Math.floor(Math.random() * 30) + 5,
      joinedAt: new Date(),
    };
    return of(position).pipe(delay(600));
  }

  /**
   * Leave queue
   */
  leaveQueue(stationId: string, userId: string): Observable<void> {
    return of(undefined).pipe(delay(500));
  }

  // ==================== ANALYTICS METHODS ====================

  /**
   * Get revenue data
   */
  getRevenueData(dateRange: any): Observable<RevenueData> {
    const revenueData: RevenueData = {
      period: AnalyticsPeriod.MONTH,
      total: 15000 + Math.random() * 5000,
      byStation: this.mockStations.slice(0, 5).map((s) => ({
        stationId: s.id,
        stationName: s.name,
        revenue: 2000 + Math.random() * 3000,
      })),
      byChargerType: [
        {
          chargerType: 'Level 2',
          revenue: 8000 + Math.random() * 2000,
        },
        {
          chargerType: 'DC Fast',
          revenue: 12000 + Math.random() * 3000,
        },
      ],
      trend: this.generateTrendData(30),
    };
    return of(revenueData).pipe(delay(700));
  }

  /**
   * Get utilization data
   */
  getUtilizationData(dateRange: any): Observable<UtilizationData> {
    const utilizationData: UtilizationData = {
      period: AnalyticsPeriod.MONTH,
      averageUtilization: 65 + Math.random() * 20,
      byStation: this.mockStations.slice(0, 5).map((s) => ({
        stationId: s.id,
        stationName: s.name,
        utilization: 40 + Math.random() * 50,
      })),
      heatmap: this.generateHeatmapData(),
      downtimeData: this.mockChargers.slice(0, 5).map((c) => ({
        chargerId: c.id,
        downtime: Math.random() * 5,
      })),
    };
    return of(utilizationData).pipe(delay(700));
  }

  /**
   * Get user behavior data
   */
  getUserBehaviorData(): Observable<UserBehaviorData> {
    const behaviorData: UserBehaviorData = {
      newUsers: Math.floor(Math.random() * 100) + 20,
      returningUsers: Math.floor(Math.random() * 500) + 100,
      geographicDistribution: [
        {
          location: 'Downtown',
          userCount: 250,
          latitude: 40.7128,
          longitude: -74.006,
        },
        {
          location: 'Midtown',
          userCount: 180,
          latitude: 40.7549,
          longitude: -73.9840,
        },
        {
          location: 'Uptown',
          userCount: 120,
          latitude: 40.7829,
          longitude: -73.9654,
        },
      ],
      sessionDurationDistribution: [
        { duration: '0-30 min', count: 150 },
        { duration: '30-60 min', count: 280 },
        { duration: '60-120 min', count: 200 },
        { duration: '120+ min', count: 50 },
      ],
      peakUsageTimes: this.generatePeakUsageData(),
      customerLifetimeValue: this.mockUsers.map((u) => ({
        userId: u.id,
        value: Math.random() * 5000 + 500,
      })),
    };
    return of(behaviorData).pipe(delay(800));
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Generate mock stations
   */
  private generateMockStations(): Station[] {
    const locations: Location[] = [
      {
        latitude: 40.7128,
        longitude: -74.006,
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
      {
        latitude: 40.7549,
        longitude: -73.9840,
        address: '456 Park Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10022',
        country: 'USA',
      },
      {
        latitude: 40.7829,
        longitude: -73.9654,
        address: '789 5th Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10065',
        country: 'USA',
      },
      {
        latitude: 40.6892,
        longitude: -74.0445,
        address: '321 Brooklyn St',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201',
        country: 'USA',
      },
      {
        latitude: 40.7614,
        longitude: -73.9776,
        address: '654 Broadway',
        city: 'New York',
        state: 'NY',
        zipCode: '10012',
        country: 'USA',
      },
    ];

    return Array.from({ length: 15 }, (_, i) => ({
      id: `station_${i + 1}`,
      name: `Charging Station ${i + 1}`,
      location: locations[i % locations.length],
      operatorId: i % 3 === 0 ? '2' : `operator_${i}`,
      status: Math.random() > 0.1 ? StationStatus.ACTIVE : StationStatus.MAINTENANCE,
      totalChargers: 5 + Math.floor(Math.random() * 10),
      availableChargers: Math.floor(Math.random() * 8),
      pricing: {
        baseRate: 0.3 + Math.random() * 0.2,
        peakRate: 0.5 + Math.random() * 0.3,
        peakHoursStart: '08:00',
        peakHoursEnd: '20:00',
      },
      gridSettings: {
        maxPowerDraw: 100 + Math.random() * 400,
        renewableEnergyPercentage: Math.floor(Math.random() * 100),
        smartChargingEnabled: Math.random() > 0.3,
      },
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    }));
  }

  /**
   * Generate mock chargers
   */
  private generateMockChargers(): Charger[] {
    const chargers: Charger[] = [];
    this.mockStations.forEach((station) => {
      for (let i = 0; i < station.totalChargers; i++) {
        chargers.push({
          id: `charger_${station.id}_${i + 1}`,
          stationId: station.id,
          chargerNumber: i + 1,
          type: Math.random() > 0.4 ? ChargerType.LEVEL_2 : ChargerType.DC_FAST,
          powerOutput: Math.random() > 0.4 ? 11 : 50,
          status: [ChargerStatus.AVAILABLE, ChargerStatus.IN_USE, ChargerStatus.OFFLINE][
            Math.floor(Math.random() * 3)
          ],
          connectorType:
            Math.random() > 0.6 ? ConnectorType.TYPE_2 : ConnectorType.CCS,
          createdAt: new Date(),
          lastStatusUpdate: new Date(),
        });
      }
    });
    return chargers;
  }

  /**
   * Generate mock reservations
   */
  private generateMockReservations(): Reservation[] {
    return Array.from({ length: 30 }, (_, i) => ({
      id: `reservation_${i + 1}`,
      userId: ['1', '2', '3'][i % 3],
      stationId: this.mockStations[i % this.mockStations.length].id,
      chargerType: Math.random() > 0.5 ? ChargerType.LEVEL_2 : ChargerType.DC_FAST,
      reservationDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
      startTime: `${8 + Math.floor(Math.random() * 12)}:00`,
      endTime: `${10 + Math.floor(Math.random() * 10)}:00`,
      targetSoC: TargetSoC.EIGHTY_PERCENT,
      status: [
        ReservationStatus.CONFIRMED,
        ReservationStatus.COMPLETED,
        ReservationStatus.ACTIVE,
      ][i % 3],
      estimatedCost: 15 + Math.random() * 35,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  /**
   * Generate mock sessions
   */
  private generateMockSessions(): ChargingSession[] {
    return Array.from({ length: 20 }, (_, i) => {
      const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + (1 + Math.random() * 3) * 60 * 60 * 1000);

      return {
        id: `session_${i + 1}`,
        userId: ['1', '2', '3'][i % 3],
        stationId: this.mockStations[i % this.mockStations.length].id,
        chargerId: this.mockChargers[i % this.mockChargers.length].id,
        chargerType: Math.random() > 0.5 ? ChargerType.LEVEL_2 : ChargerType.DC_FAST,
        startTime,
        endTime: i % 5 === 0 ? undefined : endTime,
        energyDelivered: 20 + Math.random() * 60,
        totalCost: 10 + Math.random() * 40,
        status: i % 5 === 0 ? SessionStatus.ACTIVE : SessionStatus.COMPLETED,
        currentSoC: i % 5 === 0 ? 50 + Math.random() * 50 : 100,
        targetSoC: 100,
        averagePowerOutput: 30 + Math.random() * 30,
        createdAt: startTime,
      };
    });
  }

  /**
   * Generate mock pricing rules
   */
  private generateMockPricingRules(stationId: string): PricingRule[] {
    return [
      {
        id: `rule_${stationId}_1`,
        stationId,
        name: 'Peak Hours',
        priority: 1,
        conditions: {
          timeRange: {
            startTime: '08:00',
            endTime: '20:00',
          },
          daysOfWeek: [1, 2, 3, 4, 5],
        },
        priceAction: {
          type: PricingRuleType.MULTIPLIER,
          value: 1.3,
        },
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `rule_${stationId}_2`,
        stationId,
        name: 'High Grid Load',
        priority: 2,
        conditions: {
          gridLoadThreshold: 80,
        },
        priceAction: {
          type: PricingRuleType.MULTIPLIER,
          value: 1.5,
        },
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Generate trend data for charts
   */
  private generateTrendData(days: number): Array<{ timestamp: Date; revenue: number }> {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      return {
        timestamp: date,
        revenue: 400 + Math.random() * 600,
      };
    });
  }

  /**
   * Generate heatmap data
   */
  private generateHeatmapData(): Array<{ dayOfWeek: number; hour: number; utilization: number }> {
    const data = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        data.push({
          dayOfWeek: day,
          hour,
          utilization: 20 + Math.random() * 60,
        });
      }
    }
    return data;
  }

  /**
   * Generate peak usage data
   */
  private generatePeakUsageData(): Array<{ hour: number; count: number }> {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 100 + Math.random() * 200 + (i >= 8 && i <= 20 ? 100 : 0),
    }));
  }

  /**
   * Initialize real-time updates
   */
  private initializeRealTimeUpdates(): void {
    // Simulate price updates every 5 seconds
    setInterval(() => {
      const stationId = this.mockStations[0].id;
      const priceUpdate: PriceUpdate = {
        stationId,
        currentPrice: 0.3 + Math.random() * 0.3,
        previousPrice: 0.3 + Math.random() * 0.3,
        gridLoad: 30 + Math.random() * 60,
        renewableEnergy: 20 + Math.random() * 70,
        timestamp: new Date(),
      };
      this.priceUpdateSubject.next(priceUpdate);
    }, 5000);

    // Simulate session updates every 2 seconds
    setInterval(() => {
      const activeSession = this.mockSessions.find((s) => s.status === SessionStatus.ACTIVE);
      if (activeSession) {
        const update: SessionUpdate = {
          sessionId: activeSession.id,
          currentSoC: Math.min(100, activeSession.currentSoC + Math.random() * 5),
          energyDelivered:
            activeSession.energyDelivered + Math.random() * 0.5,
          totalCost: activeSession.totalCost + Math.random() * 0.2,
          currentPowerOutput: 40 + Math.random() * 10,
          estimatedTimeRemaining: Math.max(
            0,
            (activeSession.targetSoC - activeSession.currentSoC) * 60
          ),
          timestamp: new Date(),
        };
        this.sessionUpdateSubject.next(update);
      }
    }, 2000);

    // Simulate queue updates every 30 seconds
    setInterval(() => {
      const stationId = this.mockStations[0].id;
      const queueUpdate: QueueUpdate = {
        stationId,
        queueLength: Math.floor(Math.random() * 10),
        averageWaitTime: 10 + Math.random() * 20,
        positionChanges: [],
        timestamp: new Date(),
      };
      this.queueUpdateSubject.next(queueUpdate);
    }, 30000);
  }
}
