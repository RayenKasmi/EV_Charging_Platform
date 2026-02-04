import { Module } from '@nestjs/common';
import { StationsService } from './stations.service';
import { StationsController } from './stations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChargersService } from './charger.service';
import { CacheService } from '../common/cache/cache.service';

@Module({
  imports: [PrismaModule],
  providers: [StationsService, ChargersService, CacheService],
  controllers: [StationsController],
  exports: [StationsService, ChargersService, CacheService],
})
export class StationsModule {}
