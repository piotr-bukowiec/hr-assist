import { IAbsenceEntity } from '../attendance/attendance.types';
import { ICompanyEntity } from '../companies/company.types';

export enum Location {
  PRODUCTION = 1,
  OFFICE = 2,
}

export enum ContractType {
  EMPLOYMENT_CONTRACT = 1,
}

export interface IWorkScheduleEntity {
  start: string;
  end: string;
}

export type IWorkScheduleDto = IWorkScheduleEntity;

export interface ILeaveEntity {
  base: number;
  overdue: number;
  current: number;
}

export interface IEmployeeEntity {
  id: string;
  name: string;
  surname: string;
  pesel: string;
  createdAt: Date;
  updatedAt: Date;
  position: string;
  location: Location;
  company: ICompanyEntity;
  workHours: number;
  workSchedule: IWorkScheduleEntity;
  employmentDate: Date;
  contractType: ContractType;
  firedAt: Date | null;
  absences: IAbsenceEntity[];
  leave: ILeaveEntity;
}

export type ILeaveDto = Pick<ILeaveEntity, 'base'>;

export type ICreateEmployeeDto = Omit<
  IEmployeeEntity,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'firedBy'
  | 'createdBy'
  | 'firedAt'
  | 'company'
  | 'absences'
  | 'leave'
> & {
  company: string;
  leave: number;
};

export interface IEmployeeResponseDto extends IEmployeeEntity {
  ok: boolean;
}
