import {
    IsString,
    IsNotEmpty,
    MinLength,
    MaxLength,
    IsNumber,
    Min,
    Max,
    IsBoolean,
    IsOptional,
    IsArray,
    ValidateNested,
    ArrayMinSize,
    IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateChargerDto } from './create-charger.dto';
import { StationStatus } from '../enums';

export class CreateStationDto {

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(20)
    name: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    city: string;

    @IsNumber()
    @Type(() => Number)
    @Min(-90)
    @Max(90)
    latitude: number;

    @IsNumber()
    @Type(() => Number)
    @Min(-180)
    @Max(180)
    longitude: number;

    @IsEnum(StationStatus)
    @IsOptional()
    status?: StationStatus;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @Type(() => CreateChargerDto)
    chargers: CreateChargerDto[];
}