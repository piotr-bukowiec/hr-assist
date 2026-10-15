import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream, statSync } from 'fs';
import { pipeline } from 'stream/promises';
import { ReportsService } from './reports.service';
import { GetMonthReportParamsDto } from './dto/get-month-report.dto';

const XLSX_CONTENT_TYPE: string =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Generates the employee's monthly timesheet and sends it as an .xlsx
   * download. The file is piped straight into the response: returning a
   * StreamableFile would be wrapped in JSON by the global
   * ResponseWrapperInterceptor and the client would receive a broken file.
   */
  @Get('/:employeeId/:year/:month')
  async getMonthReportForSingleEmployee(
    @Param() getMonthReportDto: GetMonthReportParamsDto,
    @Res() res: Response,
  ): Promise<void> {
    const { filePath, fileName } =
      await this.reportsService.getMonthReportForSingleEmployee(
        getMonthReportDto,
      );

    const fileStats = statSync(filePath);

    res.set({
      'Content-Type': XLSX_CONTENT_TYPE,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': fileStats.size.toString(),
    });

    await pipeline(createReadStream(filePath), res);
  }
}
