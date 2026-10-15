import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { EmployeesService } from '../employees/employees.service';
import { LeaveDetailsDto, LeaveDto } from './dto/leave.dto';
import { AbsenceEntity } from '../attendance/entities/absence.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, LessThan } from 'typeorm';
import { getYear } from 'date-fns';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { LEAVE_TYPES } from 'src/common/constants';

@Injectable()
export class LeavesService {
  constructor(
    @Inject(forwardRef(() => EmployeesService))
    private readonly employeesService: EmployeesService,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findLeaveForCurrentYear(employeeId: string): Promise<LeaveDto> {
    const currentYear: number = getYear(new Date());
    const employee = await this.employeesService.findOneById(employeeId);

    const overdueBaseValue = employee.leave?.overdue ?? 0;
    const currentBaseValue = employee.leave?.current ?? 26;

    const leavesCount: number = await this.findLeavesCountByYear(
      employeeId,
      currentYear,
    );

    const overdue: LeaveDetailsDto = {
      base: overdueBaseValue,
      used: 0,
    };

    const current: LeaveDetailsDto = {
      base: currentBaseValue,
      used: 0,
    };

    if (leavesCount <= overdue.base) {
      overdue.used = leavesCount;
      current.used = 0;
    } else {
      overdue.used = overdue.base;
      current.used = leavesCount - overdue.base;
    }

    const leaveDto: LeaveDto = {
      overdue,
      current,
    };

    console.log('LEAVE DTO: ', leaveDto);

    return leaveDto;
  }

  async findLeavesCountByYear(
    employeeId: string,
    year: number,
  ): Promise<number> {
    await this.employeesService.findOneById(employeeId);

    const { leavesCount } = (await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)::int', 'leavesCount')
      .from(AbsenceEntity, 'a')
      .where('a.employeeId = :employeeId', { employeeId })
      .andWhere('EXTRACT(YEAR FROM a.date) = :year', { year })
      .andWhere('a.type IN (:...leaveTypes)', {
        leaveTypes: LEAVE_TYPES,
      })
      .getRawOne<{ leavesCount: number }>())!;

    return leavesCount;
  }

  async canAddLeave(employeeId: string): Promise<boolean> {
    const {
      leave: { current, overdue },
    }: EmployeeEntity = await this.employeesService.findOneById(employeeId);
    const currentYear: number = getYear(new Date());
    const { leavesCount } = (await this.dataSource
      .createQueryBuilder()
      .select('COUNT(a.id)::int', 'leavesCount')
      .from(AbsenceEntity, 'a')
      .where('a.employeeId = :employeeId', { employeeId })
      .andWhere('EXTRACT(YEAR FROM a.date) = :currentYear', { currentYear })
      .andWhere('a.type IN (:...leaveTypes)', {
        leaveTypes: LEAVE_TYPES,
      })
      .getRawOne<{ leavesCount: number }>())!;

    const fullLeaveBase: number = overdue + current;

    return leavesCount < fullLeaveBase;
  }

  async canLeaveBeSetForEmployee(
    employeeId: string,
    leave: number,
  ): Promise<boolean> {
    const {
      leave: { current, overdue },
    } = await this.employeesService.findOneById(employeeId);

    if (leave >= current) return true;

    const currentYear: number = getYear(new Date());

    const usedLeavesCount: number = await this.findLeavesCountByYear(
      employeeId,
      currentYear,
    );

    const newTotalAvailableLeave: number = leave + overdue;

    return usedLeavesCount <= newTotalAvailableLeave;
  }

  async hasLeavesBeforeGivenDate(
    employeeId: string,
    newEmploymentDate: Date,
  ): Promise<boolean> {
    return await AbsenceEntity.existsBy({
      employee: { id: employeeId },
      date: LessThan(newEmploymentDate),
    });
  }
}
