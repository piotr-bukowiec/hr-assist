import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';
import { Type } from 'class-transformer';
import { IsNotEmptyObject, IsOptional, ValidateNested } from 'class-validator';
import { WorkScheduleDto } from './work-schedule.dto';

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['workSchedule'] as const),
) {
  @IsOptional()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => WorkScheduleDto)
  workSchedule?: WorkScheduleDto;
}
