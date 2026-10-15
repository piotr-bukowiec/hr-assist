import { AbsenceType } from '../../attendance/attendance.types';
import {
  TimesheetSource,
  toMonthlyTimesheetData,
} from './timesheet-report.mapper';
import { Company, DailyTimesheetRow, Employee } from './timesheet-report.types';

const WORK_HOURS = 7;

/**
 * Mirrors what TypeORM returns: `date` columns (employmentDate) come as
 * 'YYYY-MM-DD' strings, even though the entity types them as Date.
 */
const makeEmployee = (fields: object = {}): Employee =>
  ({
    workHours: WORK_HOURS,
    workSchedule: { start: '07:00:00', end: '14:00:00' },
    employmentDate: '2026-09-01',
    firedAt: null,
    ...fields,
  }) as unknown as Employee;

const company = {} as Company;

/** Absences and holidays come from the database as UTC midnight. */
const utc = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

const buildSeptember = (overrides: Partial<TimesheetSource> = {}) =>
  toMonthlyTimesheetData({
    employee: makeEmployee(),
    company,
    year: 2026,
    month: 9,
    absences: [],
    holidays: [],
    ...overrides,
  });

/** Row of the given day of September 2026 (1 Sep 2026 is a Tuesday). */
const day = (rows: DailyTimesheetRow[], n: number): DailyTimesheetRow =>
  rows[n - 1];

describe('toMonthlyTimesheetData', () => {
  it('renders one row per day of the month', () => {
    expect(buildSeptember().rows).toHaveLength(30);
  });

  it('counts a workday without an absence as fully worked', () => {
    expect(day(buildSeptember().rows, 1)).toMatchObject({
      isDayOff: false,
      workHoursRange: '07:00-14:00',
      nominalHours: WORK_HOURS,
      actualHours: WORK_HOURS,
      absence: null,
    });
  });

  it.each(Object.values(AbsenceType))(
    'books %s as 0 worked hours and the full day as that absence',
    (type) => {
      const { rows } = buildSeptember({
        absences: [{ date: utc('2026-09-02'), type }],
      });

      expect(day(rows, 2)).toMatchObject({
        isDayOff: false,
        nominalHours: WORK_HOURS,
        actualHours: 0,
        absence: { status: type, hours: WORK_HOURS },
      });
    },
  );

  it('treats weekends as days off, even with an absence recorded', () => {
    const { rows } = buildSeptember({
      absences: [{ date: utc('2026-09-05'), type: AbsenceType.SICK_LEAVE }],
    });

    expect(day(rows, 5)).toMatchObject({
      isDayOff: true,
      dayLabel: 'Sobota',
      nominalHours: 0,
      actualHours: 0,
      absence: null,
    });
  });

  it('labels workdays with the full weekday name', () => {
    const { rows } = buildSeptember();

    expect(day(rows, 2)).toMatchObject({ dayLabel: 'Środa' });
  });

  it('treats public holidays as days off labelled with weekday and name', () => {
    const { rows } = buildSeptember({
      holidays: [{ date: utc('2026-09-03'), name: 'Święto testowe' }],
      absences: [{ date: utc('2026-09-03'), type: AbsenceType.VACATION_LEAVE }],
    });

    expect(day(rows, 3)).toMatchObject({
      isDayOff: true,
      dayLabel: 'Czwartek (Święto testowe)',
      actualHours: 0,
      absence: null,
    });
  });

  it('reports no hours before the employment date', () => {
    const { rows } = buildSeptember({
      employee: makeEmployee({ employmentDate: '2026-09-16' }),
    });

    expect(day(rows, 15)).toMatchObject({ isDayOff: true, nominalHours: 0 });
    expect(day(rows, 16)).toMatchObject({ actualHours: WORK_HOURS });
  });

  it('counts the firing day and reports no hours after it', () => {
    const { rows } = buildSeptember({
      employee: makeEmployee({ firedAt: new Date(2026, 8, 28, 15, 30) }),
    });

    expect(day(rows, 28)).toMatchObject({ actualHours: WORK_HOURS });
    expect(day(rows, 29)).toMatchObject({ isDayOff: true, nominalHours: 0 });
    expect(day(rows, 30)).toMatchObject({ isDayOff: true, nominalHours: 0 });
  });
});
