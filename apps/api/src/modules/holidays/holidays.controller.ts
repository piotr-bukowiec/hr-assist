import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { HolidayEntity } from './entities/holiday.entity';

@Auth()
@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get('{/:year}')
  async findHolidays(
    @Param('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe)
    year: number,
  ): Promise<HolidayEntity[]> {
    return this.holidaysService.findHolidays(year);
  }
}
