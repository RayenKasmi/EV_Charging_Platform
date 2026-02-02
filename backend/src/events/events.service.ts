import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

export interface ChargerStatusUpdate {
  chargerId: string;
  stationId: string;
  status: string;
  updatedAt: Date;
}

export interface SlotUpdate {
  chargerId: string;
  stationId: string;
  reservedFrom: Date;
  reservedTo: Date;
  action: 'created' | 'cancelled' | 'expired';
}

export interface ChargerAvailability {
  chargerId: string;
  stationId: string;
  slots: {
    reservedFrom: Date;
    reservedTo: Date;
    status: string;
  }[];
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly eventsGateway: EventsGateway) {}

  /**
   * Emit charger status update to all subscribed clients
   * Broadcasts to both charger-specific and station rooms
   */
  emitChargerStatusUpdate(update: ChargerStatusUpdate) {
    const chargerRoom = `charger:${update.chargerId}`;
    const stationRoom = `station:${update.stationId}`;

    this.logger.log(
      `Emitting charger status update for charger ${update.chargerId}: ${update.status}`,
    );

    // Emit to charger-specific room
    this.eventsGateway.server
      .to(chargerRoom)
      .emit('chargerStatusUpdated', update);

    // Also emit to station room for station-level subscribers
    this.eventsGateway.server
      .to(stationRoom)
      .emit('chargerStatusUpdated', update);
  }

  /**
   * Emit slot update when a reservation is created/cancelled/expired
   * This is the main event for real-time availability updates
   */
  emitSlotsUpdated(update: SlotUpdate) {
    const chargerRoom = `charger:${update.chargerId}`;
    const stationRoom = `station:${update.stationId}`;

    this.logger.log(
      `Emitting slots update for charger ${update.chargerId}: ${update.action}`,
    );

    // Emit to charger-specific room
    this.eventsGateway.server.to(chargerRoom).emit('slotsUpdated', update);

    // Also emit to station room
    this.eventsGateway.server.to(stationRoom).emit('slotsUpdated', update);
  }

  /**
   * Emit full availability data for a charger
   * Used when clients need the complete current state
   */
  emitChargerAvailability(availability: ChargerAvailability) {
    const chargerRoom = `charger:${availability.chargerId}`;

    this.logger.log(
      `Emitting full availability for charger ${availability.chargerId}`,
    );

    this.eventsGateway.server
      .to(chargerRoom)
      .emit('chargerAvailability', availability);
  }

  /**
   * Emit station availability update
   * Broadcasts aggregated availability for all chargers in a station
   */
  emitStationAvailability(
    stationId: string,
    availability: {
      total: number;
      available: number;
      occupied: number;
      offline: number;
      maintenance: number;
    },
  ) {
    const stationRoom = `station:${stationId}`;

    this.logger.log(`Emitting station availability for station ${stationId}`);

    this.eventsGateway.server.to(stationRoom).emit('stationAvailability', {
      stationId,
      ...availability,
      updatedAt: new Date(),
    });
  }
}
