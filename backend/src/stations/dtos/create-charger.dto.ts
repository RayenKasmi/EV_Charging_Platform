import {
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import {ChargerType, ConnectorType, ChargerStatus} from '../enums';
import { Type } from 'class-transformer';

export class CreateChargerDto {
  @IsString()
  @IsNotEmpty()
  chargerId: string;

  @IsEnum(ChargerType)
  type: ChargerType;

  @IsEnum(ConnectorType)
  connectorType: ConnectorType;

  @IsEnum(ChargerStatus)
  @IsOptional()
  status?: ChargerStatus; 

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  powerKW: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  currentRate?: number;
}
