import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserEntity } from '../users/user.entity';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token: string =
            (req?.cookies?.['accessToken'] as string) ?? null;
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<UserEntity> {
    // const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const token: string | null =
      (req?.cookies?.['accessToken'] as string) ??
      ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    console.log(token);

    if (!token) {
      throw new UnauthorizedException();
    }

    const user = (await this.usersService.findByAccessToken(
      token,
    )) as UserEntity;

    if (!user || user.id !== payload.sub) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
