import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Usuario } from '@prisma/client';
import { SessionService } from './session.service';
import { IS_PUBLIC_KEY } from './public.decorator';

const COOKIE = process.env.SESSION_COOKIE_NAME ?? 'vianda_session';

export interface AuthedRequest extends Request {
  user?: Usuario;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token = (req.cookies as Record<string, string> | undefined)?.[COOKIE];
    if (!token) throw new UnauthorizedException('No autenticado');

    const user = await this.sessions.validateAndSlide(token);
    if (!user) throw new UnauthorizedException('Sesión inválida o expirada');

    req.user = user;
    return true;
  }
}
