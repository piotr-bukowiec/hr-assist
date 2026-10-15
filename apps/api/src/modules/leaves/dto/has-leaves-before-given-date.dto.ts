import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';
import { IsNotBeforeAppStart } from 'src/common/validators/is-not-before-app-start.validator';

export class HasLeavesBeforeGivenDateQueryDto {
  @Type(() => Date)
  @IsDate()
  @IsNotBeforeAppStart()
  date: Date;
}
