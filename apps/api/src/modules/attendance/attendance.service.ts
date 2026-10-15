import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import { DateQueryDto } from './dto/date-query.dto';
import { AbsenceEntity } from './entities/absence.entity';
import { EmployeesService } from '../employees/employees.service';
import { FindOptionsWhere, Between, MoreThan } from 'typeorm';
import {
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  set,
} from 'date-fns';
import { ChangeAttendanceStatusDto } from './dto/change-attendance-status.dto';
import { AbsenceType, AttendanceStatus } from './attendance.types';
import { LeavesService } from '../leaves/leaves.service';
import { LEAVE_TYPES } from 'src/common/constants';

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(forwardRef(() => EmployeesService))
    private readonly employeesService: EmployeesService,

    @Inject(forwardRef(() => LeavesService))
    private readonly leavesService: LeavesService,
  ) {}

  async findAbsences(
    employeeId: string,
    { year, month }: DateQueryDto,
  ): Promise<AbsenceEntity[]> {
    await this.employeesService.findOne(employeeId);

    const where: FindOptionsWhere<AbsenceEntity> = {
      employee: { id: employeeId },
    };

    if (year) {
      if (month) {
        const targetDate: Date = set(new Date(), { year, month, date: 0 });

        where.date = Between(startOfMonth(targetDate), endOfMonth(targetDate));
      } else {
        const targetDate: Date = set(new Date(), { year });

        where.date = Between(startOfYear(targetDate), endOfYear(targetDate));
      }
    }

    return AbsenceEntity.find({ where });
  }

  async changeAttendanceStatus(
    employeeId: string,
    { date, status }: ChangeAttendanceStatusDto,
  ) {
    const employee = await this.employeesService.findOne(employeeId);
    if (employee.firedAt)
      throw new UnprocessableEntityException('Employee is fired');

    if (status === AttendanceStatus.PRESENCE) {
      await AbsenceEntity.delete({ employee: { id: employeeId }, date });
      return;
    }

    if (LEAVE_TYPES.includes(status as unknown as AbsenceType)) {
      const canAddLeave: boolean =
        await this.leavesService.canAddLeave(employeeId);

      if (!canAddLeave)
        throw new UnprocessableEntityException(
          'Pracownik wyczerpał limit urlopów na żądanie i wypoczynkowych na bieżący rok',
        );
    }
    const newAbsence = await AbsenceEntity.upsert(
      {
        employee: { id: employeeId },
        date,
        type: status as unknown as AbsenceType,
      },
      ['employee', 'date'],
    );
    console.log('NEW ABSENCE: ', newAbsence);
  }

  async hasUnexcusedAbsences(employeeId: string): Promise<boolean> {
    return await AbsenceEntity.existsBy({
      employee: { id: employeeId },
      type: AbsenceType.UNEXCUSED_ABSENCE,
    });
  }

  async countAbsencesAfter(employeeId: string, date: Date): Promise<number> {
    await this.employeesService.findOne(employeeId);

    const count: number = await AbsenceEntity.countBy({
      employee: { id: employeeId },
      date: MoreThan(date),
    });

    if (count < 0) {
      throw new InternalServerErrorException('Błąd podczas liczenia braków');
    }

    return count;
  }
}
