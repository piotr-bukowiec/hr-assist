import { IEmployeeEntity } from '../employees/employee.types';

export interface ICompanyEntity {
  id: string;
  name: string;
  nip: string;
  address: IAddressEntity;
  employees: IEmployeeEntity[];
}

export interface IAddressEntity {
  id: string;
  street: string;
  houseNumber: number;
  postCode: string;
  city: string;
  company: ICompanyEntity;
}
export type ICreateAddressDto = Omit<IAddressEntity, 'id' | 'company'>;
export type ICreateCompanyDto = Omit<
  ICompanyEntity,
  'id' | 'address' | 'employees'
> & {
  address: IUpdateAddressDto;
};

export type IUpdateCompanyDto = Partial<ICreateCompanyDto>;
export type IUpdateAddressDto = Partial<ICreateAddressDto>;
