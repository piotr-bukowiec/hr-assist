import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export const Auth = () => applyDecorators(UseGuards(JwtAuthGuard));
