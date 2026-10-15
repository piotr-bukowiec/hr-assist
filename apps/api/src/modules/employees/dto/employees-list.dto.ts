import {
  ContractType,
  IEmployeeResponseDto,
  Location,
} from '../employee.types';
import { WorkScheduleEntity } from '../entities/work-schedule.entity';
import { AbsenceEntity } from 'src/modules/attendance/entities/absence.entity';
import { LeaveEntity } from '../entities/leave.entity';
import { CompanyEntity } from 'src/modules/companies/entities/company.entity';

export class EmployeeResponseDto implements IEmployeeResponseDto {
  ok: boolean;
  id: string;
  name: string;
  surname: string;
  pesel: string;
  createdAt: Date;
  updatedAt: Date;
  position: string;
  location: Location;
  company: CompanyEntity;
  workHours: number;
  workSchedule: WorkScheduleEntity;
  employmentDate: Date;
  contractType: ContractType;
  firedAt: Date | null;
  absences: AbsenceEntity[];
  leave: LeaveEntity;
}
