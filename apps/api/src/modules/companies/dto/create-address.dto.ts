import { Type } from 'class-transformer';
import { IsInt, IsString, Length, Matches, Min } from 'class-validator';
import { ICreateAddressDto } from '../company.types';

export class CreateAddressDto implements ICreateAddressDto {
  @IsString()
  @Length(1, 255)
  street: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  houseNumber: number;

  @IsString()
  @Matches(/^\d{2}-\d{3}$/, {
    message: 'postCode must match the XX-XXX format',
  })
  postCode: string;

  @IsString()
  @Length(1, 255)
  city: string;
}
