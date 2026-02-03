import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChargerDto } from './dtos/create-charger.dto';
import { UpdateChargerDto } from './dtos/update-charger.dto';
import { ChargerStatus } from './enums';
import { UserRole } from '../auth/enums/user-role.enum';
import { EventsService } from '../events/events.service';
import { CacheService } from '../common/cache/cache.service';


@Injectable()
export class ChargersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly cacheService: CacheService,
  ) {}

  private readonly cachePrefix = 'stations:search:';

  async isChargerIdAvailable(chargerId: string) {
    const existing = await this.prisma.charger.findUnique({
      where: { chargerId },
      select: { id: true },
    });

    return !existing;
  }

  async create(
    stationId: string,
    createChargerDto: CreateChargerDto,
    userId: string, 
    userRoles: string[],
  ) {
    const station = await this.prisma.station.findFirst({
      where: {
        id: stationId,
        deletedAt: null,
      },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${stationId} not found`);
    }

    if(
        station.operatorId !== userId &&
        !userRoles.includes(UserRole.ADMIN)
      ){
        throw new ForbiddenException('You do not have permission to add chargers to this station');
      }

    // Check if charger ID is unique
    const existing = await this.prisma.charger.findUnique({
      where: { chargerId: createChargerDto.chargerId },
    });

    if (existing) {
      throw new BadRequestException(
        `Charger with id ${createChargerDto.chargerId} already exists`,
      );
    }

    const created = await this.prisma.charger.create({
      data: {
        ...createChargerDto,
        stationId,
      },
    });
    await this.cacheService.deleteByPrefix(this.cachePrefix);
    return created;
  }

  async findByStation(stationId: string) {
    return await this.prisma.charger.findMany({
      where: { stationId },
      orderBy: { createdAt: 'asc' },
    });
  }
  async update(
    stationId: string,
    chargerId: string,
    updateChargerDto: UpdateChargerDto,
    userId: string,
    userRoles: string[],
  ) {
    const charger = await this.prisma.charger.findFirst({
      where: {
        id: chargerId,
        stationId,
      },
      include: {
        station: true,
      },
    });

    if (!charger) {
      throw new NotFoundException(`Charger with ID ${chargerId} not found`);
    }

    if(
      charger.station.operatorId !== userId &&
      !userRoles.includes(UserRole.ADMIN)
    ){
      throw new ForbiddenException('You do not have permission to update this charger');
    }

    const updated = await this.prisma.charger.update({
      where: { id: chargerId },
      data: updateChargerDto,
    });

    await this.cacheService.deleteByPrefix(this.cachePrefix);
    return updated;
  }

  async remove(
    stationId: string,
    chargerId: string,
    userId: string,
    userRoles: string[],
  ) {
    const charger = await this.prisma.charger.findFirst({
      where: {
        id: chargerId,
        stationId,
      },
      include: {
        station: true,
      },
    });

    if (!charger) {
      throw new NotFoundException(`Charger with ID ${chargerId} not found`);
    }

    if(
      charger.station.operatorId !== userId &&
      !userRoles.includes(UserRole.ADMIN)
    ){
      throw new ForbiddenException('You do not have permission to delete this charger');
    }

    // forbid deletion if chager is occupied
    if (charger.status === 'OCCUPIED') {
      throw new BadRequestException(
        'Cannot delete charger that is currently occupied',
      );
    }

    await this.prisma.charger.delete({
      where: { id: chargerId },
    });

    await this.cacheService.deleteByPrefix(this.cachePrefix);
  }

  async updateStatus(chargerId: string, status: string) {
    // validate status
    if(!Object.values(ChargerStatus).includes(status as ChargerStatus)) {
        throw new BadRequestException(`Invalid status value: ${status}`);
    }
    // ensure charger exists
    const charger = await this.prisma.charger.findUnique({
      where: { id: chargerId },
    });

    if (!charger) {
      throw new NotFoundException(`Charger with ID ${chargerId} not found`);
    }

    const updatedCharger = await this.prisma.charger.update({
      where: { id: chargerId },
      data: { status: status as any },
    });

    await this.cacheService.deleteByPrefix(this.cachePrefix);

    // Emit real-time status update
    this.eventsService.emitChargerStatusUpdate({
      chargerId: updatedCharger.id,
      stationId: updatedCharger.stationId,
      status: updatedCharger.status,
      updatedAt: updatedCharger.updatedAt,
    });

    return updatedCharger;
  }
}