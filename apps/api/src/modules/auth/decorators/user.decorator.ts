import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../../users/user.entity';
import { RemoveFunctions } from 'src/types/generic/remove-functions.types';

export const User = createParamDecorator(
  <K extends keyof RemoveFunctions<UserEntity>>(
    data: K | undefined,
    ctx: ExecutionContext,
  ): RemoveFunctions<UserEntity> | RemoveFunctions<UserEntity>[K] | null => {
    const request = ctx.switchToHttp().getRequest<{ user: UserEntity }>();
    const { user } = request;

    return !user ? null : data ? user[data] : user;
  },
);
