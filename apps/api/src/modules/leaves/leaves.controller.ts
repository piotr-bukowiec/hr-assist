import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { LeaveDto } from './dto/leave.dto';
import { CanLeaveBeSetQueryDto } from './dto/can-be-leave-set-query.dto';
import { HasLeavesBeforeGivenDateQueryDto } from './dto/has-leaves-before-given-date.dto';

@Controller('employees/:employeeId/leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get('/')
  findLeaveForCurrentYear(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ): Promise<LeaveDto> {
    return this.leavesService.findLeaveForCurrentYear(employeeId);
  }

  @Get('/can-be-set')
  canLeaveBeSetForEmployee(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' }))
    employeeId: string,
    @Query() { leave }: CanLeaveBeSetQueryDto,
  ): Promise<boolean> {
    return this.leavesService.canLeaveBeSetForEmployee(employeeId, leave);
  }

  @Get('/has-leaves-before-given-date')
  hasLeavesBeforeGivenDate(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' }))
    employeeId: string,
    @Query() { date }: HasLeavesBeforeGivenDateQueryDto,
  ): Promise<boolean> {
    return this.leavesService.hasLeavesBeforeGivenDate(employeeId, date);
  }
}
