import { Module, forwardRef } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { CompaniesModule } from '../companies/companies.module';
import { CompaniesService } from '../companies/companies.service';
import { AttendanceModule } from '../attendance/attendance.module';
import { IsCompanyIdConstraint } from 'src/common/validators/is-company-id.validator';
import { IsNotBeforeAppStartConstraint } from 'src/common/validators/is-not-before-app-start.validator';
import { LeavesModule } from '../leaves/leaves.module';
import { IsEmployeeExistsConstraint } from 'src/common/validators/is-employee-exists.validator';

@Module({
  imports: [
    forwardRef(() => CompaniesModule),
    forwardRef(() => AttendanceModule),
    forwardRef(() => LeavesModule),
  ],
  controllers: [EmployeesController],
  providers: [
    EmployeesService,
    CompaniesService,
    IsCompanyIdConstraint,
    IsNotBeforeAppStartConstraint,
    IsEmployeeExistsConstraint,
  ],
  exports: [forwardRef(() => EmployeesService)],
})
export class EmployeesModule {}
