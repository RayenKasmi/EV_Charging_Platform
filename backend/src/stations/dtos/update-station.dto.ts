import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateStationDto } from './create-station.dto';

export class UpdateStationDto extends PartialType(
  OmitType(CreateStationDto, ['chargers'] as const),
) {}