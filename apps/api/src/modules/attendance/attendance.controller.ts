import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AbsenceEntity } from './entities/absence.entity';
import { DateQueryDto } from './dto/date-query.dto';
import { ChangeAttendanceStatusDto } from './dto/change-attendance-status.dto';
import { SpecificDateQueryDto } from './dto/specific-date-query.dto';

@Controller('employees/:employeeId/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('/absences')
  findAbsences(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' }))
    employeeId: string,
    @Query() dateQueryDto: DateQueryDto,
  ): Promise<AbsenceEntity[]> {
    return this.attendanceService.findAbsences(employeeId, dateQueryDto);
  }

  @Get('/absences/count-after')
  countAbsencesAfter(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' }))
    employeeId: string,
    @Query() { date }: SpecificDateQueryDto,
  ): Promise<number> {
    return this.attendanceService.countAbsencesAfter(employeeId, date);
  }

  @Put('/')
  changeAttendanceStatus(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' }))
    employeeId: string,
    @Body() changeAttendanceStatusDto: ChangeAttendanceStatusDto,
  ): Promise<void> {
    return this.attendanceService.changeAttendanceStatus(
      employeeId,
      changeAttendanceStatusDto,
    );
  }
}
