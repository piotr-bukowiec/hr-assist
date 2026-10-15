import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateCompanyDto } from './create-company.dto';
import { IsNotEmptyObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateAddressDto } from './update-address.dto';

export class UpdateCompanyDto extends PartialType(
  OmitType(CreateCompanyDto, ['nip', 'address'] as const),
) {
  @IsOptional()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address: UpdateAddressDto;
}
