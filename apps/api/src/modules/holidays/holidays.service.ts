import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getNagerApiUrl, polishName } from './utils/holidays.util';
import { IHolidayDto, NagerApiResponse } from './holiday.types';
import * as _ from 'lodash';
import { HolidayEntity } from './entities/holiday.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { Between, DataSource, EntityManager } from 'typeorm';
import { endOfMonth, isWeekend, startOfMonth } from 'date-fns';

@Injectable()
export class HolidaysService implements OnModuleInit {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  private readonly logger: Logger = new Logger(HolidaysService.name);

  async onModuleInit(): Promise<void> {
    await this.syncHolidays();
  }

  private async fetchHolidays(year?: number): Promise<IHolidayDto[]> {
    const url: string = getNagerApiUrl(year);

    try {
      const response = await fetch(url);
      const holidaysFromApi: NagerApiResponse[] =
        (await response.json()) as NagerApiResponse[];

      return holidaysFromApi.map(
        ({ name, date }: NagerApiResponse): IHolidayDto => ({
          name,
          date,
        }),
      );
    } catch (error) {
      throw new Error(`Failed to fetch holidays: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async syncHolidays(): Promise<void> {
    this.logger.log('Syncing holidays');
    const year: number = new Date().getFullYear();

    const freshData: IHolidayDto[] = (await this.fetchHolidays(year)).map(
      ({ name, ...rest }) => ({ name: polishName(name), ...rest }),
    );

    const existingData: HolidayEntity[] = await HolidayEntity.find({
      select: {
        name: true,
        date: true,
      },
    });

    const existingCleaned: Pick<HolidayEntity, 'name' | 'date'>[] =
      existingData.map(({ name, date }) => ({
        name,
        date,
      }));

    const isTheSame: boolean = _.isEqual(
      _.sortBy(freshData, ['date']),
      _.sortBy(existingCleaned, ['date']),
    );

    if (!isTheSame) {
      this.logger.log('Fetching holidays from API');
      await this.dataSource.manager.transaction(
        async (manager: EntityManager) => {
          await manager.clear(HolidayEntity);

          const entitiesToSave: HolidayEntity[] = freshData.map((data) =>
            HolidayEntity.create(data),
          );
          await manager.save(entitiesToSave);
        },
      );
    }
  }

  async findHolidays(
    year: number = new Date().getFullYear(),
  ): Promise<HolidayEntity[]> {
    const currentYear = new Date().getFullYear();

    if (year < 2026 || year > currentYear + 5) {
      throw new Error(`Year ${year} is out of allowed range.`);
    }

    return await HolidayEntity.findBy({
      date: Between(new Date(`${year}-01-01`), new Date(`${year}-12-31`)),
    });
  }

  async findHolidaysForMonth({
    month,
    year,
  }: {
    month: number;
    year: number;
  }): Promise<HolidayEntity[]> {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error(
        'Miesiąc musi być liczbą całkowitą z przedziału od 1 do 12.',
      );
    }

    const baseDate = new Date(year, month - 1, 1);
    const startDate = startOfMonth(baseDate);
    const endDate = endOfMonth(baseDate);

    return await HolidayEntity.findBy({
      date: Between(startDate, endDate),
    });
  }

  async isDuvetDay(date: Date): Promise<boolean> {
    return isWeekend(date) || (await HolidayEntity.existsBy({ date }));
  }
}
