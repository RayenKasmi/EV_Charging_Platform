import { Module } from '@nestjs/common';
import { StationsService } from './stations.service';
import { StationsController } from './stations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChargersService } from './charger.service';

@Module({
  imports: [PrismaModule],
  providers: [StationsService, ChargersService],
  controllers: [StationsController],
  exports: [StationsService, ChargersService],
})
export class StationsModule {}
