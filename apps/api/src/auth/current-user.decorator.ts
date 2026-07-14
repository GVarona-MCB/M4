import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Usuario } from '@prisma/client';
import type { AuthedRequest } from './auth.guard';

/** Inyecta el usuario autenticado (puesto por AuthGuard) en el handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Usuario => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    return req.user as Usuario;
  },
);
