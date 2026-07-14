import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import type { AuthedRequest } from './auth.guard';

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? 'vianda_session';
const CSRF_COOKIE = 'csrf';
const SECURE = process.env.SESSION_SECURE === 'true';
const TTL_MS = Number(process.env.SESSION_TTL_MINUTES ?? 15) * 60_000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Public()
  @Get('csrf')
  csrf(@Res({ passthrough: true }) res: Response): { csrfToken: string } {
    const token = randomBytes(24).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // debe ser legible por el front para reenviarlo en el header
      sameSite: 'lax',
      secure: SECURE,
      path: '/',
    });
    return { csrfToken: token };
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ id: string; nombre: string; rol: string }> {
    const result = await this.auth.login(dto.email, dto.password);
    if (!result) {
      // Mensaje genérico: no revela si el email existe (anti-enumeración)
      throw new UnauthorizedException('Credenciales inválidas');
    }
    res.cookie(SESSION_COOKIE, result.sid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: SECURE,
      maxAge: TTL_MS,
      path: '/',
    });
    return { id: result.user.id, nombre: result.user.nombre, rol: result.user.rol };
  }

  @Post('logout')
  async logout(
    @Req() req: AuthedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
    if (token) await this.sessions.destroy(token);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  me(@Req() req: AuthedRequest): { id: string; nombre: string; rol: string } {
    const user = req.user;
    if (!user) throw new UnauthorizedException();
    return { id: user.id, nombre: user.nombre, rol: user.rol };
  }
}
