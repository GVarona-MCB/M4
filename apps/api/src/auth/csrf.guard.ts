import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Anti-CSRF por double-submit: el header x-csrf-token debe coincidir con la cookie `csrf`
// en toda operación que cambia estado (FR-035). SameSite=Lax es capa complementaria.
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method.toUpperCase())) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const cookie = (req.cookies as Record<string, string> | undefined)?.csrf;
    const header = req.header('x-csrf-token');
    if (!cookie || !header || cookie !== header) {
      throw new ForbiddenException('CSRF token inválido');
    }
    return true;
  }
}
