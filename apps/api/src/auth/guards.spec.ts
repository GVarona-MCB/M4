import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';
import { RolesGuard } from './roles.guard';

function ctxWith(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('CsrfGuard (FR-035)', () => {
  it('permite métodos seguros (GET)', () => {
    const guard = new CsrfGuard(new Reflector());
    expect(guard.canActivate(ctxWith({ method: 'GET' }))).toBe(true);
  });

  it('rechaza POST sin coincidencia de token', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const guard = new CsrfGuard(reflector);
    const req = { method: 'POST', cookies: { csrf: 'a' }, header: () => 'b' };
    expect(() => guard.canActivate(ctxWith(req))).toThrow(ForbiddenException);
  });

  it('permite POST con token coincidente', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const guard = new CsrfGuard(reflector);
    const req = { method: 'POST', cookies: { csrf: 'tok' }, header: () => 'tok' };
    expect(guard.canActivate(ctxWith(req))).toBe(true);
  });
});

describe('RolesGuard (FR-003)', () => {
  it('permite si no hay roles requeridos', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctxWith({ user: { rol: 'EMPLEADO' } }))).toBe(true);
  });

  it('rechaza si el rol no está permitido (acceso cruzado)', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SECRETARIA']);
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(ctxWith({ user: { rol: 'EMPLEADO' } }))).toThrow(
      ForbiddenException,
    );
  });

  it('permite si el rol coincide', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SECRETARIA']);
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctxWith({ user: { rol: 'SECRETARIA' } }))).toBe(true);
  });
});
