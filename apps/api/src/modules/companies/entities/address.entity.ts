import {
  Entity,
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm';
import { IAddressEntity } from '../company.types';
import { CompanyEntity } from './company.entity';
import { Exclude } from 'class-transformer';

@Entity('addresses')
export class AddressEntity extends BaseEntity implements IAddressEntity {
  @Exclude()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  street: string;

  @Column({ type: 'int', unsigned: true })
  houseNumber: number;

  @Column({ type: 'varchar', length: '6' })
  postCode: string;

  @Column({ type: 'varchar', length: 255 })
  city: string;

  @OneToOne(() => CompanyEntity, (company) => company.address)
  company: CompanyEntity;
}
