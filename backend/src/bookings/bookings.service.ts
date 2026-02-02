import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Get available time slots for a charger
   */
  async getChargerSlots(chargerId: string, date?: string) {
    // Verify charger exists
    const charger = await this.prisma.charger.findUnique({
      where: { id: chargerId },
      include: { station: true },
    });

    if (!charger) {
      throw new NotFoundException(`Charger with ID ${chargerId} not found`);
    }

    // Get reservations for the charger
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        chargerId,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
        reservedFrom: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { reservedFrom: 'asc' },
      select: {
        id: true,
        reservedFrom: true,
        reservedTo: true,
        status: true,
      },
    });

    return {
      chargerId,
      stationId: charger.stationId,
      chargerStatus: charger.status,
      date: startDate.toISOString().split('T')[0],
      reservations,
    };
  }

  /**
   * Create a new reservation
   */
  async createReservation(userId: string, dto: CreateReservationDto) {
    const { chargerId, reservedFrom, reservedTo } = dto;

    // Verify charger exists and get station info
    const charger = await this.prisma.charger.findUnique({
      where: { id: chargerId },
      include: { station: true },
    });

    if (!charger) {
      throw new NotFoundException(`Charger with ID ${chargerId} not found`);
    }

    // Validate time range
    const startTime = new Date(reservedFrom);
    const endTime = new Date(reservedTo);
    const now = new Date();

    if (startTime < now) {
      throw new BadRequestException('Reservation start time must be in the future');
    }

    if (endTime <= startTime) {
      throw new BadRequestException('Reservation end time must be after start time');
    }

    // Check for overlapping reservations
    const overlapping = await this.prisma.reservation.findFirst({
      where: {
        chargerId,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
        OR: [
          {
            // New reservation starts during existing reservation
            reservedFrom: { lte: startTime },
            reservedTo: { gt: startTime },
          },
          {
            // New reservation ends during existing reservation
            reservedFrom: { lt: endTime },
            reservedTo: { gte: endTime },
          },
          {
            // New reservation completely contains existing reservation
            reservedFrom: { gte: startTime },
            reservedTo: { lte: endTime },
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('Time slot is not available');
    }

    // Create the reservation
    const reservation = await this.prisma.reservation.create({
      data: {
        userId,
        chargerId,
        reservedFrom: startTime,
        reservedTo: endTime,
        status: ReservationStatus.CONFIRMED,
      },
      include: {
        charger: {
          include: { station: true },
        },
      },
    });

    // Emit real-time update
    this.eventsService.emitSlotsUpdated({
      chargerId,
      stationId: charger.stationId,
      reservedFrom: startTime,
      reservedTo: endTime,
      action: 'created',
    });

    return reservation;
  }

  /**
   * Get user's reservations
   */
  async getUserReservations(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: {
        charger: {
          include: {
            station: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: { reservedFrom: 'desc' },
    });
  }

  /**
   * Get a single reservation by ID
   */
  async getReservation(id: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        charger: {
          include: {
            station: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    if (reservation.userId !== userId) {
      throw new ForbiddenException('You do not have access to this reservation');
    }

    return reservation;
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(id: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { charger: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    if (reservation.userId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this reservation');
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation is already cancelled');
    }

    const updatedReservation = await this.prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CANCELLED },
      include: {
        charger: {
          include: { station: true },
        },
      },
    });

    // Emit real-time update
    this.eventsService.emitSlotsUpdated({
      chargerId: reservation.chargerId,
      stationId: reservation.charger.stationId,
      reservedFrom: reservation.reservedFrom,
      reservedTo: reservation.reservedTo,
      action: 'cancelled',
    });

    return updatedReservation;
  }
}
