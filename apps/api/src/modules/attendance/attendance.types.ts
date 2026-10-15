import { IEmployeeEntity } from '../employees/employee.types';

export enum AbsenceType {
  SICK_LEAVE = 'CH',
  UNEXCUSED_ABSENCE = 'NN',
  UNPAID_LEAVE = 'UB',
  VACATION_LEAVE = 'UW',
  MATERNITY_LEAVE = 'UM',
  UNPAID_EXCUSED_ABSENCE = 'NUN',
  PAID_EXCUSED_ABSENCE = 'NUP',
  PATERNITY_LEAVE = 'UO',
  CARE = 'OP',
  REHABILITATION_BENEFIT = 'REH',
  PARENTAL_LEAVE = 'UR',
  ON_DEMAND_LEAVE = 'UŻ',
  CIRCUMSTANTIAL_LEAVE = 'UOK',
  DAY_OFF_FOR_HOLIDAY = 'WZS',
  PARENTAL_CHILD_LEAVE = 'WYC',
}

export enum AttendanceStatus {
  PRESENCE = 'OB',
  SICK_LEAVE = 'CH',
  UNEXCUSED_ABSENCE = 'NN',
  UNPAID_LEAVE = 'UB',
  VACATION_LEAVE = 'UW',
  MATERNITY_LEAVE = 'UM',
  UNPAID_EXCUSED_ABSENCE = 'NUN',
  PAID_EXCUSED_ABSENCE = 'NUP',
  PATERNITY_LEAVE = 'UO',
  CARE = 'OP',
  REHABILITATION_BENEFIT = 'REH',
  PARENTAL_LEAVE = 'UR',
  ON_DEMAND_LEAVE = 'UŻ',
  CIRCUMSTANTIAL_LEAVE = 'UOK',
  DAY_OFF_FOR_HOLIDAY = 'WZS',
  PARENTAL_CHILD_LEAVE = 'WYC',
  HOLIDAY = 'ŚUW',
}

export interface IAbsenceEntity {
  id: string;
  employee: IEmployeeEntity;
  type: AbsenceType;
  date: Date;
}

export interface IDateQueryDto {
  year?: number; // min. 2026, max. currentYear + 5
  month?: number; // min. 1, max. 12
}

export interface IChangeAttendanceStatusDto {
  status: AttendanceStatus;
  date: Date; // min. 01.01.2026, max. currentDate + 5 years
}

export interface ISpecificDateQueryDto {
  date: Date;
}
