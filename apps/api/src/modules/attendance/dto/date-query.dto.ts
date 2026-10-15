import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { IDateQueryDto } from '../attendance.types';

export class DateQueryDto implements IDateQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(2026)
  @Max(new Date().getFullYear() + 5)
  year?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;
}
