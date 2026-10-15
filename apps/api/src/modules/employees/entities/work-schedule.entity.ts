import { Column } from 'typeorm';
import { IWorkScheduleEntity } from '../employee.types';

export class WorkScheduleEntity implements IWorkScheduleEntity {
  @Column({ type: 'time' })
  start: string;

  @Column({ type: 'time' })
  end: string;
}
