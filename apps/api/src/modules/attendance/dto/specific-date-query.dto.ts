import { Transform } from 'class-transformer';
import { IsISO8601, IsNotEmpty } from 'class-validator';
import { parseISO, isValid } from 'date-fns';
import { IsNotBeforeAppStart } from 'src/common/validators/is-not-before-app-start.validator';
import { BadRequestException } from '@nestjs/common';
import { ISpecificDateQueryDto } from '../attendance.types';
import { IsNotTooFarDate } from '../validators/is-not-too-far-date.validator';

export class SpecificDateQueryDto implements ISpecificDateQueryDto {
  @IsNotEmpty()
  @IsISO8601()
  @Transform(({ value }: { value: string }) => {
    if (!value) throw new BadRequestException('Data jest wymagana');
    const parsed: Date = parseISO(value);
    if (!isValid(parsed)) throw new BadRequestException('Nieprawidłowa data');
    return parsed;
  })
  @IsNotBeforeAppStart()
  @IsNotTooFarDate()
  date: Date;
}
