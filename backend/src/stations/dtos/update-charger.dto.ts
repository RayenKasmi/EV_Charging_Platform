import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateChargerDto } from './create-charger.dto';

export class UpdateChargerDto extends PartialType(
  OmitType(CreateChargerDto, ['chargerId'] as const),
) {}