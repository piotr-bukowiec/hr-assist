import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, ValidateNested, Max } from 'class-validator';
import { ILeaveDetailsDto, ILeaveDto } from '../leaves.types';
import { Type } from 'class-transformer';

export class LeaveDetailsDto implements ILeaveDetailsDto {
  @ApiProperty({
    example: 26,
    description: 'Wymiar bazowy urlopu (20 lub 26 dni)',
  })
  @Min(0)
  @Max(26)
  base: number;

  @ApiProperty({ example: 13, description: 'Liczba wykorzystanych dni urlopu' })
  @IsNumber()
  @Min(0)
  used: number;
}

export class LeaveDto implements ILeaveDto {
  @ApiProperty({
    type: () => LeaveDetailsDto,
    description: 'Urlop zaległy z poprzedniego roku',
  })
  @ValidateNested()
  @Type(() => LeaveDetailsDto)
  overdue: LeaveDetailsDto;

  @ApiProperty({ type: () => LeaveDetailsDto, description: 'Urlop bieżący' })
  @ValidateNested()
  @Type(() => LeaveDetailsDto)
  current: LeaveDetailsDto;
}
