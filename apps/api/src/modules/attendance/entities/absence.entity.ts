import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AbsenceType, IAbsenceEntity } from '../attendance.types';
import { EmployeeEntity } from 'src/modules/employees/entities/employee.entity';

@Entity('absences')
@Unique(['employee', 'date'])
export class AbsenceEntity extends BaseEntity implements IAbsenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AbsenceType,
    default: AbsenceType.UNEXCUSED_ABSENCE,
  })
  type: AbsenceType;

  @Column({ type: 'timestamp with time zone' })
  date: Date;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.absences)
  @JoinColumn({ name: 'employeeId' })
  employee: EmployeeEntity;
}
