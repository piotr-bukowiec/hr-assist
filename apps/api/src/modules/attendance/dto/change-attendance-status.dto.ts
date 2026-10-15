import { IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';
import {
  AttendanceStatus,
  IChangeAttendanceStatusDto,
} from '../attendance.types';
import { IsNotDuvetDay } from 'src/common/validators/is-not-duvet-day.validator';

export class ChangeAttendanceStatusDto implements IChangeAttendanceStatusDto {
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @Transform(({ value }) => {
    if (!value) {
      throw new BadRequestException('Date is required');
    }

    const parsedDate = new Date(value as string);

    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException(
        'Date must be a valid ISO 8601 string (YYYY-MM-DD format)',
      );
    }

    return parsedDate;
  })
  @IsNotDuvetDay()
  date: Date;
}
