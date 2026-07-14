import { SetMetadata } from '@nestjs/common';
import { Rol } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restringe una ruta a los roles indicados (autorización en backend, FR-003). */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
