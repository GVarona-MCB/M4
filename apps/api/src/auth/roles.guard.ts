import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Rol } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import type { AuthedRequest } from './auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger('Security');

  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Rol[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const user = req.user;
    if (!user || !required.includes(user.rol)) {
      this.logger.warn(`Acceso denegado (rol ${user?.rol ?? 'anónimo'}) a ${req.method} ${req.url}`);
      throw new ForbiddenException('No tiene permiso para esta operación');
    }
    return true;
  }
}
