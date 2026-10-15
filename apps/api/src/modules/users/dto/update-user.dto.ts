import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IUpdateUserDto } from '../user.types';

export class UpdateUserDto
  extends PartialType(CreateUserDto)
  implements IUpdateUserDto {}
