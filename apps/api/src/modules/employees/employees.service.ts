import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeEntity } from './entities/employee.entity';
import { WorkScheduleDto } from './dto/work-schedule.dto';
import { CompaniesService } from '../companies/companies.service';
import { CompanyEntity } from '../companies/entities/company.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Not } from 'typeorm';
import { EmployeeResponseDto } from './dto/employees-list.dto';
import { AttendanceService } from '../attendance/attendance.service';
import { LeavesService } from '../leaves/leaves.service';

@Injectable()
export class EmployeesService {
  constructor(
    @Inject(forwardRef(() => CompaniesService))
    private readonly companiesService: CompaniesService,

    @Inject(forwardRef(() => AttendanceService))
    private readonly attendanceService: AttendanceService,

    @Inject(forwardRef(() => LeavesService))
    private readonly leavesService: LeavesService,

    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}
  async findAll(): Promise<EmployeeResponseDto[]> {
    const employees = await EmployeeEntity.find({
      withDeleted: true,
      relations: {
        absences: true,
      },
    });

    const employeesListDto: EmployeeResponseDto[] = await Promise.all(
      employees.map(async (emp) => {
        const hasUnexcusedAbsences: boolean =
          await this.attendanceService.hasUnexcusedAbsences(emp.id);

        return {
          ...emp,
          ok: !hasUnexcusedAbsences,
        };
      }),
    );

    return employeesListDto;
  }

  async findOne(id: string): Promise<EmployeeResponseDto> {
    const employee = await EmployeeEntity.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }
    const hasUnexcusedAbsences: boolean =
      await this.attendanceService.hasUnexcusedAbsences(id);

    return {
      ...employee,
      ok: !hasUnexcusedAbsences,
    };
  }

  /** `withDeleted` includes fired employees (`firedAt` is the soft-delete column). */
  async findOneById(
    id: string,
    { withDeleted = false }: { withDeleted?: boolean } = {},
  ): Promise<EmployeeEntity> {
    const employee = await EmployeeEntity.findOne({
      where: { id },
      withDeleted,
    });
    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }
    return employee;
  }

  async exists(id: string): Promise<boolean> {
    return await EmployeeEntity.exists({ where: { id }, withDeleted: true });
  }

  async create({
    pesel,
    workSchedule,
    workHours,
    company: companyId,
    leave,
    ...rest
  }: CreateEmployeeDto): Promise<EmployeeEntity> {
    const isPeselTaken: boolean = await EmployeeEntity.existsBy({ pesel });
    if (isPeselTaken) throw new ConflictException('Pesel is already taken');

    const company: CompanyEntity =
      await this.companiesService.findOne(companyId);

    this.validateWorkSchedule(workSchedule, workHours);

    const employee: EmployeeEntity = EmployeeEntity.create({
      pesel,
      workSchedule,
      workHours,
      company,
      leave: {
        base: leave,
        current: leave,
      },
      ...rest,
    });

    return await employee.save();
  }

  async update(
    id: string,
    {
      pesel,
      company: companyId,
      workSchedule,
      workHours,
      employmentDate,
      ...restDto
    }: UpdateEmployeeDto,
  ): Promise<EmployeeEntity> {
    const employee: EmployeeEntity = await this.findOneById(id);

    if (employee.firedAt)
      throw new UnprocessableEntityException('Employee is fired');

    if (pesel && pesel !== employee.pesel) {
      const isPeselTaken: boolean = await EmployeeEntity.existsBy({
        pesel,
        id: Not(id),
      });
      if (isPeselTaken) throw new ConflictException('Pesel is already taken');
    }

    Object.assign(employee, restDto);

    if (companyId && companyId !== employee.company.id) {
      employee.company.id = companyId;
    }

    if (workSchedule && workHours) {
      this.validateWorkSchedule(workSchedule, workHours);
    }

    if (employmentDate && employmentDate !== employee.employmentDate) {
      if (employmentDate > employee.employmentDate) {
        const hasInvalidLeaves: boolean =
          await this.leavesService.hasLeavesBeforeGivenDate(
            employee.id,
            employmentDate,
          );
        if (hasInvalidLeaves)
          throw new UnprocessableEntityException(
            'Employee has invalid leaves before new employment date',
          );
      }

      employee.employmentDate = employmentDate;
    }

    return await employee.save();
  }

  async remove(id: string): Promise<EmployeeEntity> {
    const employee = await this.findOneById(id);

    return await employee.remove();
  }

  async fire(id: string): Promise<EmployeeEntity> {
    const employee = await this.findOneById(id);
    if (employee.firedAt)
      throw new UnprocessableEntityException('Employee is fired');

    return await employee.softRemove();
  }

  async recover(id: string): Promise<EmployeeEntity> {
    const employee = await EmployeeEntity.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!employee)
      throw new NotFoundException(`Employee with id ${id} not found`);

    if (!employee.firedAt)
      throw new UnprocessableEntityException('Employee is not fired');

    return await employee.recover();
  }

  private validateWorkSchedule(
    { start, end }: WorkScheduleDto,
    workHours: number,
  ): void {
    if (workHours < 1 || workHours > 8)
      throw new BadRequestException('Work hours must be between 1 and 8');

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    if (startMinute || endMinute)
      throw new BadRequestException('Time must be in aligned to full hours');

    if (startHour >= endHour)
      throw new BadRequestException('Start time must be before end time');

    if (startHour < 6 || startHour > 15) {
      throw new BadRequestException('Start time must be between 6 and 15');
    }

    if (endHour < 7 || endHour > 16) {
      throw new BadRequestException('End time must be between 7 and 16');
    }

    if (endHour - startHour !== workHours)
      throw new BadRequestException(
        `Work hours must be equal to ${workHours} hours`,
      );

    return;
  }

  async removeAll(): Promise<void> {
    await EmployeeEntity.createQueryBuilder().delete().execute();
  }

  async findAllPositions(): Promise<string[]> {
    const result: string[] = (
      await this.dataSource
        .createQueryBuilder()
        .select('DISTINCT position')
        .from(EmployeeEntity, 'employee')
        .getRawMany<Pick<EmployeeEntity, 'position'>>()
    ).map(({ position }: Pick<EmployeeEntity, 'position'>) => position);

    return result;
  }

  async checkPeselAvailability(pesel: string): Promise<boolean> {
    const isPeselTaken: boolean = await EmployeeEntity.existsBy({ pesel });
    return !isPeselTaken;
  }
}
