import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import { cwd } from 'process';
import { GetMonthReportParamsDto } from './dto/get-month-report.dto';
import { AttendanceService } from '../attendance/attendance.service';
import { GeneratedReportFile } from './engine/reports.types';
import { HolidaysService } from '../holidays/holidays.service';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { EmployeesService } from '../employees/employees.service';
import { ReportEngine } from './engine/report.engine';
import { CompaniesService } from '../companies/companies.service';
import { toMonthlyTimesheetData } from './engine/timesheet-report.mapper';
import { getReportRelativePath } from './engine/reports.utils';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(forwardRef(() => AttendanceService))
    private readonly attendanceService: AttendanceService,

    @Inject(forwardRef(() => HolidaysService))
    private readonly holidaysService: HolidaysService,

    @Inject(forwardRef(() => EmployeesService))
    private readonly employeesService: EmployeesService,

    @Inject(forwardRef(() => CompaniesService))
    private readonly companiesService: CompaniesService,

    private readonly reportEngine: ReportEngine,
  ) {}

  /**
   * Collects the employee's attendance for the month, renders the timesheet
   * and saves it under reports/{yyyy}/{mm}/.
   */
  async getMonthReportForSingleEmployee({
    employeeId,
    month,
    year,
  }: GetMonthReportParamsDto): Promise<GeneratedReportFile> {
    // Fired employees are soft-deleted, but their past months stay reportable.
    const employee: EmployeeEntity = await this.employeesService.findOneById(
      employeeId,
      { withDeleted: true },
    );

    const [company, absences, holidays] = await Promise.all([
      this.companiesService.findOne(employee.company.id),
      this.attendanceService.findAbsences(employeeId, { year, month }),
      this.holidaysService.findHolidaysForMonth({ year, month }),
    ]);

    const timesheet = toMonthlyTimesheetData({
      employee,
      company,
      year,
      month,
      absences,
      holidays,
    });
    const report: Buffer = await this.reportEngine.generateReportBuffer([
      timesheet,
    ]);

    const filePath: string = await this.saveReportFile(
      getReportRelativePath(employee, year, month),
      report,
    );

    return { filePath, fileName: basename(filePath) };
  }

  /**
   * Writes the report under the working directory, creating its folders,
   * and returns the absolute path of the file.
   */
  private async saveReportFile(
    relativePath: string,
    report: Buffer,
  ): Promise<string> {
    const filePath: string = join(cwd(), relativePath);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, report);

    return filePath;
  }
}
