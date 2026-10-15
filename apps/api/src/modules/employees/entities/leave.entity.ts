import { Column } from 'typeorm';
import { ILeaveEntity } from '../employee.types';

export class LeaveEntity implements ILeaveEntity {
  @Column({ type: 'smallint', unsigned: true })
  base: number;

  @Column({ type: 'smallint', unsigned: true, default: 0 })
  overdue: number;

  @Column({ type: 'smallint', unsigned: true })
  current: number;
}
