import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { StationsService } from './stations.service';
import { ChargersService } from './charger.service';
import { StationQueryDto } from './dtos/station-query.dto';
import { CreateStationDto } from './dtos/create-station.dto';
import { UpdateStationDto } from './dtos/update-station.dto';
import { CreateChargerDto } from './dtos/create-charger.dto';
import { UpdateChargerDto } from './dtos/update-charger.dto';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Stations')
@Controller('stations')
export class StationsController {
  constructor(
    private readonly stationService: StationsService,
    private readonly chargerService: ChargersService,
  ) {}
  
  @Get()
  @ApiOperation({ summary: 'Get all stations with filtering' })
  @ApiResponse({ status: 200, description: 'return all stations' })
  async findAll(@Query() query: StationQueryDto) {
    return await this.stationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get station by ID' })
  @ApiResponse({ status: 200, description: 'Return station details' })
  @ApiResponse({ status: 404, description: 'Station not found' }) 
  async findOne(@Param('id') id: string) {
    return await this.stationService.findOne(id);
  }

  @Get(':id/availibility')
  @ApiOperation({ summary: 'Get station availibility by ID' })
  @ApiResponse({ status: 200, description: 'Return station availibility details' })
  @ApiResponse({ status: 404, description: 'Station not found' })
  async getAvailability(@Param('id') id: string) {
    return await this.stationService.getAvailability(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new station.' })
  @ApiResponse({ status: 201, description: 'Station created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin or Operator access required' })
  async createStation(@Body() createStationDto: CreateStationDto, @GetUser('userId') userId ) {
    return await this.stationService.create(
      createStationDto,
      userId,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update station.' })
  @ApiResponse({ status: 200, description: 'Station updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin or Operator access required' })
  @ApiResponse({ status: 404, description: 'Station not found' })
  async updateStation(@Param('id') id: string, @Body() updateStationDto: UpdateStationDto, @GetUser('userId') userId, @GetUser('roles') roles) {
    return await this.stationService.update(
      id, 
      updateStationDto,
      userId,
      roles
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft Delete station' })
  @ApiResponse({ status: 200, description: 'Station deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required' })
  @ApiResponse({ status: 404, description: 'Station not found' })
  async deleteStation(@Param('id') id: string, @GetUser('userId') userId, @GetUser('roles') roles) {
    return await this.stationService.remove(id, userId, roles);
  }

  @Post(':id/chargers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add charger to station' })
  @ApiResponse({ status: 201, description: 'Charger added successfully' })
  async addCharger(
    @Param('id') stationId: string,
    @Body() createChargerDto: CreateChargerDto,
    @Request() req
  ) {
    return await this.chargerService.create(
      stationId,
      createChargerDto,
      req.user.userId,
      req.user.roles
    );
  }

  @Get(':id/chargers')
  @ApiOperation({ summary: 'Get all chargers at station' })
  @ApiResponse({ status: 200, description: 'Return all chargers' })
  async getChargers(@Param('id') stationId: string) {
    return await this.chargerService.findByStation(stationId);
  }

  @Patch(':id/chargers/:chargerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update charger' })
  @ApiResponse({ status: 200, description: 'Charger updated successfully' })
  async updateCharger(
    @Param('id') stationId: string,
    @Param('chargerId') chargerId: string,
    @Body() updateChargerDto: UpdateChargerDto,
    @GetUser('userId') userId, 
    @GetUser('roles') roles
  ) {
    return await this.chargerService.update(
      stationId,
      chargerId,
      updateChargerDto,
      userId,
      roles
    );
  }

  @Delete(':id/chargers/:chargerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete charger' })
  @ApiResponse({ status: 200, description: 'Charger deleted successfully' })
  async removeCharger(
    @Param('id') stationId: string,
    @Param('chargerId') chargerId: string,
    @GetUser('userId') userId, 
    @GetUser('roles') roles
  ) {
    await this.chargerService.remove(
      stationId,
      chargerId,
      userId,
      roles
    );
    return { message: 'Charger deleted successfully' };
  }

}
