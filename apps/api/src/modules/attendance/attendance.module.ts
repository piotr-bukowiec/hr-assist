import { Module, forwardRef } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { EmployeesModule } from '../employees/employees.module';
import { IsNotDuvetDayConstraint } from 'src/common/validators/is-not-duvet-day.validator';
import { HolidaysModule } from '../holidays/holidays.module';
import { LeavesModule } from '../leaves/leaves.module';

@Module({
  imports: [
    forwardRef(() => EmployeesModule),
    forwardRef(() => HolidaysModule),
    forwardRef(() => LeavesModule),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, IsNotDuvetDayConstraint],
  exports: [forwardRef(() => AttendanceService)],
})
export class AttendanceModule {}
