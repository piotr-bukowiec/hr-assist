import { Module, forwardRef } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { EmployeesModule } from '../employees/employees.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { LeavesModule } from '../leaves/leaves.module';
import { CompaniesModule } from '../companies/companies.module';
import { HolidaysModule } from '../holidays/holidays.module';
import { ReportEngine } from './engine/report.engine';

@Module({
  imports: [
    forwardRef(() => EmployeesModule),
    forwardRef(() => AttendanceModule),
    forwardRef(() => LeavesModule),
    forwardRef(() => CompaniesModule),
    forwardRef(() => HolidaysModule),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportEngine],
})
export class ReportsModule {}
