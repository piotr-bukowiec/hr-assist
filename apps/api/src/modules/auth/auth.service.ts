import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashService } from '../../common/hash/hash.service';
import { UserEntity } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';
import type { CookieOptions, Response } from 'express';
import ms from 'ms';

const COOKIE_OPTIONS: CookieOptions = {
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  sameSite: 'lax',
  httpOnly: true,
};
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, res: Response): Promise<UserEntity> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await this.hashService.compare(
      dto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);

    await this.usersService.setAccessToken(user.id, accessToken);

    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ms('30 days'),
    });

    return user;
  }

  async logout(user: UserEntity, res: Response): Promise<void> {
    await this.usersService.setAccessToken(user.id, null);

    res.clearCookie('accessToken', {
      ...COOKIE_OPTIONS,
    });
  }
}
