import { IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CanLeaveBeSetQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsIn([20, 26], { message: 'Leave must be either 20 or 26' })
  leave: number;
}
