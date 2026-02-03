import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStationDto } from './dtos/create-station.dto';
import { StationQueryDto } from './dtos/station-query.dto';
import { ChargerStatus } from './enums';
import { UpdateStationDto } from './dtos/update-station.dto';
import { UserRole } from '../auth/enums/user-role.enum';
import { Prisma } from '@prisma/client';
import { CacheService } from '../common/cache/cache.service';
@Injectable()
export class StationsService {
  private readonly cachePrefix = 'stations:search:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async create(createStationDto: CreateStationDto, operatorId: string) {
    const { chargers, ...stationData } = createStationDto;

    const created = await this.prisma.station.create({
      data: {
        ...stationData,
        operatorId,
        chargers: {
          create: chargers.map((charger) => ({
            chargerId: charger.chargerId,
            type: charger.type,
            connectorType: charger.connectorType,
            powerKW: charger.powerKW,
            currentRate: charger.currentRate,
            status: charger.status ?? ChargerStatus.AVAILABLE,
          })),
        },
      },
      include: {
        chargers: true,
        operator: {
          select: {
            id: true,
            email: true, 
            fullName: true,
          }
        }
      },
    });

    await this.cacheService.deleteByPrefix(this.cachePrefix);
    return created;
  }

  
  async findAll(query: StationQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      operatorName,
      latitude,
      longitude,
      radius = 10000,
      chargerType,
      city,
    } = query;

    const normalizedQuery: StationQueryDto = {
      page,
      limit,
      status,
      operatorName,
      latitude,
      longitude,
      radius: latitude !== undefined && longitude !== undefined ? radius : undefined,
      chargerType,
      city,
    };

    const cacheKey = this.buildCacheKey(normalizedQuery);
    const cached = await this.cacheService.get<{
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    if (latitude !== undefined && longitude !== undefined) {
      const result = await this.findNearbyStations(
        latitude,
        longitude,
        radius,
        {
          status,
          operatorName,
          chargerType,
          city,
        },
        page,
        limit,
      );

      await this.cacheService.set(cacheKey, result);
      return result;
    }

    // Build where clause
    const where: Prisma.StationWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }


    if (operatorName) {
      where.operator = {
        fullName: {
          contains: operatorName,
          mode: 'insensitive',
        },
      };
    }

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }


    if (chargerType) {
      where.chargers = {
        some: {
          ...(chargerType && { type: chargerType }),
        },
      };
    }

    const [stations, total] = await Promise.all([
      this.prisma.station.findMany({
        where,
        include: {
          chargers: true,
          operator: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.station.count({ where }),
    ]);

    const result = {
      data: stations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
    await this.cacheService.set(cacheKey, result);
    return result;
  }

  private buildCacheKey(query: StationQueryDto): string {
    // remove undefined or null values from query
    const entries = Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    );
    // sort entries by key to ensure consistent order
    const normalized = entries
      .sort(([a], [b]) => a.localeCompare(b)) // localeCompare for string comparison
      // convert to object 
      .reduce<Record<string, string | number | boolean>>((acc, [key, value]) => {
        acc[key] = value as string | number | boolean;
        return acc;
      }, {});

    // stringify it 
    return `${this.cachePrefix}${JSON.stringify(normalized)}`;
  }


  private async findNearbyStations(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    filters: {
      status?: string;
      operatorName?: string;
      chargerType?: string;
      city?: string; 
    },
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    // Build where conditions
    const conditions: string[] = ['s."deletedAt" IS NULL'];
    const params: any[] = [longitude, latitude, radiusMeters];
    let paramIndex = 4;

    if (filters.status) {
      conditions.push(`s.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }


    let operatorJoin = '';
    if (filters.operatorName) {
      operatorJoin = 'INNER JOIN "User" u ON u.id = s."operatorId"';
      conditions.push(`u."fullName" ILIKE $${paramIndex}`);
      params.push(`%${filters.operatorName}%`);
      paramIndex++;
    }

    if (filters.city) {
      conditions.push(`s.city ILIKE $${paramIndex}`);
      params.push(`%${filters.city}%`);
      paramIndex++;
    }

    let chargerJoin = '';
    if (filters.chargerType) {
      chargerJoin = 'INNER JOIN "Charger" c ON c."stationId" = s.id';
      
      if (filters.chargerType) {
        conditions.push(`c.type = $${paramIndex}`);
        params.push(filters.chargerType);
        paramIndex++;
      }
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    // prisma does not support PostGIS functions and so we use queryrawunsafe
    const stationsRaw = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT DISTINCT
        s.*,
        ST_Distance(
          s.location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM "Station" s
      ${operatorJoin}
      ${chargerJoin}
      WHERE 
        ${whereClause}
        AND ST_DWithin(
          s.location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
      ORDER BY distance ASC
      LIMIT ${limit}
      OFFSET ${skip}
      `,
      ...params,
    );

    const [{ count }] = await this.prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `
      SELECT COUNT(DISTINCT s.id) as count
      FROM "Station" s
      ${operatorJoin}
      ${chargerJoin}
      WHERE 
        ${whereClause}
        AND ST_DWithin(
          s.location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
      `,
      ...params,
    );

    // Fetch full station data
    const stationIds = stationsRaw.map((s) => s.id);
    const stations = await this.prisma.station.findMany({
      where: {
        id: { in: stationIds },
      },
      include: {
        chargers: true,
        operator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    // Merge distance data with full station data
    const stationsWithDistance = stations.map((station) => {
      const rawStation = stationsRaw.find((s) => s.id === station.id);
      return {
        ...station,
        distance: rawStation?.distance || 0,
      };
    });

    stationsWithDistance.sort((a, b) => a.distance - b.distance);

    const total = Number(count);

    const result = {
      data: stationsWithDistance,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
    return result;
  }

  async findOne(id: string) {
    const station = await this.prisma.station.findFirst({
      where: { id, deletedAt: null },
      include: { 
        chargers: true,
        operator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          }
        }
      },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }

    return station;
  }

  async getAvailability(id: string) {
    const station = await this.findOne(id);

    return {
      stationId: station.id,
      total: station.chargers.length,
      available: station.chargers.filter(
        (c) => c.status === 'AVAILABLE',
      ).length,
      occupied: station.chargers.filter(
        (c) => c.status === 'OCCUPIED',
      ).length,
      offline: station.chargers.filter(
        (c) => c.status === 'OFFLINE',
      ).length,
      maintenance:station.chargers.filter(
        (c) => c.status === 'MAINTENANCE',
      ).length
    };
  }

  async update(id: string, updateStationDto: UpdateStationDto, userId: string, userRoles: string[]) {
    // ensure the station exists 
    const station = await this.findOne(id);

    if(
      station.operatorId !== userId &&
      !userRoles.includes(UserRole.ADMIN)
    ){
      throw new ForbiddenException('You do not have permission to update this station');
    }

    const updated = await this.prisma.station.update({
      where: { id },
      data: updateStationDto,
      include: {
        chargers: true,
        operator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          }
        }
      }
    });

    await this.cacheService.deleteByPrefix(this.cachePrefix);
    return updated;
  }

  async remove(id: string, userId: string, userRoles: string[]) {
    const station = await this.findOne(id);

    if(
      station.operatorId !== userId &&
      !userRoles.includes(UserRole.ADMIN)
    ){
      throw new ForbiddenException('You do not have permission to delete this station');
    }

    await this.prisma.station.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.cacheService.deleteByPrefix(this.cachePrefix);
  }
}

