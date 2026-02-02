import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * Get available slots for a charger
   * This is the HTTP endpoint for initial data load
   */
  @Get('chargers/:chargerId/slots')
  @ApiOperation({ summary: 'Get available time slots for a charger' })
  @ApiResponse({ status: 200, description: 'Returns available slots' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date to check slots for (YYYY-MM-DD)',
  })
  async getChargerSlots(
    @Param('chargerId') chargerId: string,
    @Query('date') date?: string,
  ) {
    return this.bookingsService.getChargerSlots(chargerId, date);
  }

  /**
   * Create a new reservation
   */
  @Post('reservations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or time slot not available' })
  async createReservation(
    @GetUser('id') userId: string,
    @Body() dto: CreateReservationDto,
  ) {
    return this.bookingsService.createReservation(userId, dto);
  }

  /**
   * Get current user's reservations
   */
  @Get('reservations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reservations' })
  @ApiResponse({ status: 200, description: 'Returns user reservations' })
  async getUserReservations(@GetUser('id') userId: string) {
    return this.bookingsService.getUserReservations(userId);
  }

  /**
   * Get a specific reservation
   */
  @Get('reservations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific reservation' })
  @ApiResponse({ status: 200, description: 'Returns the reservation' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async getReservation(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.bookingsService.getReservation(id, userId);
  }

  /**
   * Cancel a reservation
   */
  @Delete('reservations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async cancelReservation(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.bookingsService.cancelReservation(id, userId);
  }
}
