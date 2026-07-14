import { Injectable } from '@nestjs/common';
import type { Proveedor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Proveedor[]> {
    return this.prisma.proveedor.findMany({ orderBy: { nombre: 'asc' } });
  }
}
