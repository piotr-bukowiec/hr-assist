import { IsString, IsNotEmpty, IsMilitaryTime } from 'class-validator';
import { IWorkScheduleDto } from '../employee.types';

export class WorkScheduleDto implements IWorkScheduleDto {
  @IsString()
  @IsNotEmpty()
  @IsMilitaryTime({ message: 'startTime must be a valid time in HH:mm format' })
  start: string;

  @IsString()
  @IsNotEmpty()
  @IsMilitaryTime({ message: 'startTime must be a valid time in HH:mm format' })
  end: string;
}
