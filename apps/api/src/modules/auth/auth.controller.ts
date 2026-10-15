import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { UserEntity } from '../users/user.entity';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { User } from './decorators/user.decorator';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserEntity> {
    return this.authService.login(dto, res);
  }

  @Auth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(
    @User() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    return this.authService.logout(user, res);
  }

  @Auth()
  @Get('/me')
  me(@User() user: UserEntity): UserEntity {
    return user;
  }
}
