import { IsString, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({
    description: 'The ID of the charger to reserve',
    example: 'uuid-charger-id',
  })
  @IsString()
  @IsNotEmpty()
  chargerId: string;

  @ApiProperty({
    description: 'Start time of the reservation',
    example: '2026-02-02T10:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  reservedFrom: string;

  @ApiProperty({
    description: 'End time of the reservation',
    example: '2026-02-02T11:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  reservedTo: string;
}
