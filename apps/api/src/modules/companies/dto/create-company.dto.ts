import { IsNotEmpty, IsString, Length, ValidateNested } from 'class-validator';
import { ICreateCompanyDto } from '../company.types';
import { CreateAddressDto } from './create-address.dto';
import { Type } from 'class-transformer';

export class CreateCompanyDto implements ICreateCompanyDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsString()
  @Length(10, 10, { message: 'NIP must be 10 digits' })
  nip: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;
}
