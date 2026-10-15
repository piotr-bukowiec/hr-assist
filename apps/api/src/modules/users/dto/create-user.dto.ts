import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ICreateUserDto } from '../user.types';

export class CreateUserDto implements ICreateUserDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(1, 100)
  surname: string;

  @IsString()
  @Length(11, 11)
  @Matches(/^\d{11}$/, { message: 'pesel must contain exactly 11 digits' })
  pesel: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
