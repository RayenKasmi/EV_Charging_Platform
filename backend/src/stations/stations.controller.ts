import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('Stations')
@Controller('stations')
export class StationsController {
  
  @Get()
  @ApiOperation({ summary: 'Get all stations (Public)' })
  @ApiResponse({ status: 200, description: 'Stations retrieved successfully' })
  getAllStations() {
    return {
      message: 'This endpoint is public - no authentication required',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get station by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Station retrieved successfully' })
  getStationById(@Param('id') id: string) {
    return {
      message: `Get station with ID: ${id}`,
      note: 'This endpoint is public',
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new station (Admin or Operator)' })
  @ApiResponse({ status: 201, description: 'Station created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Operator access required' })
  createStation(@Body() stationData: any) {
    return {
      message: 'Create new station',
      requiredRoles: ['ADMIN', 'OPERATOR'],
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update station (Admin or Operator)' })
  @ApiResponse({ status: 200, description: 'Station updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Operator access required' })
  updateStation(@Param('id') id: string, @Body() updateData: any) {
    return {
      message: `Update station with ID: ${id}`,
      requiredRoles: ['ADMIN', 'OPERATOR'],
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete station (Admin only)' })
  @ApiResponse({ status: 200, description: 'Station deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  deleteStation(@Param('id') id: string) {
    return {
      message: `Delete station with ID: ${id}`,
      requiredRole: 'ADMIN',
    };
  }
}
