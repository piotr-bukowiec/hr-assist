import { Alignment, Borders, Font } from 'exceljs';
import { EmployeeEntity } from '../../employees/entities/employee.entity';
import { CompanyEntity } from '../../companies/entities/company.entity';
import { AbsenceType } from '../../attendance/attendance.types';
import { AbsenceEntity } from '../../attendance/entities/absence.entity';
import { HolidayEntity } from '../../holidays/entities/holiday.entity';

/** Employee fields printed in the report header and used to compute hours. */
export type Employee = Pick<
  EmployeeEntity,
  | 'id'
  | 'name'
  | 'surname'
  | 'pesel'
  | 'position'
  | 'location'
  | 'contractType'
  | 'workHours'
  | 'workSchedule'
  | 'employmentDate'
  | 'firedAt'
>;

/** Company fields printed in the report header. */
export type Company = Pick<CompanyEntity, 'name' | 'nip' | 'address'>;

/** Absence recorded for one day. */
export type AttendanceRecord = Pick<AbsenceEntity, 'date' | 'type'>;

export type PublicHoliday = Pick<HolidayEntity, 'date' | 'name'>;

export interface OvertimeHours {
  day: number;
  night: number;
  saturdays: number;
  sundaysAndHolidays: number;
  nightTime: number;
}

export interface AbsenceHours {
  status: AbsenceType;
  hours: number;
}

/** One calendar day of the timesheet, already resolved to hours. */
export interface DailyTimesheetRow {
  date: Date;
  /** Full weekday name, with the holiday name if any: 'Środa (Nowy Rok)'. */
  dayLabel: string;
  /** Weekends and public holidays: no work is scheduled. */
  isDayOff: boolean;
  /** Scheduled working time, e.g. '8:00-16:00'; null on days off. */
  workHoursRange: string | null;
  nominalHours: number;
  actualHours: number;
  overtime: OvertimeHours;
  absence: AbsenceHours | null;
}

/** Everything needed to render one employee's monthly timesheet. */
export interface MonthlyTimesheetData {
  year: number;
  /** 1-12 */
  month: number;
  employee: Employee;
  company: Company;
  rows: DailyTimesheetRow[];
}

export interface ReportStyleConfig {
  colors: {
    leave: string;
    unpaidLeave: string;
    sickLeave: string;
    dayOff: string;
    zeroValueFont: string;
    generatedAtFont: string;
  };
  borders: {
    thin: Partial<Borders>;
  };
  alignments: {
    center: Partial<Alignment>;
    wrappedCenter: Partial<Alignment>;
    rotated: Partial<Alignment>;
  };
  fonts: {
    bold: Partial<Font>;
    title: Partial<Font>;
    generatedAt: Partial<Font>;
  };
  numberFormats: {
    /** Renders 0 as '-' */
    dashZero: string;
    /** Renders 0 as '0' */
    number: string;
  };
}
