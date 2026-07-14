import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import type { Pedido } from '@prisma/client';
import type { Usuario } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CurrentUser } from '../auth/current-user.decorator';

// Un usuario solo opera su propio pedido (FR-004): el id sale de la sesión, no del cliente.
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('me')
  getMine(@CurrentUser() user: Usuario): Promise<Pedido | null> {
    return this.orders.getMine(user.id);
  }

  @Post('me')
  create(@CurrentUser() user: Usuario, @Body() dto: CreateOrderDto): Promise<Pedido> {
    return this.orders.create(user.id, dto);
  }

  @Patch('me')
  update(@CurrentUser() user: Usuario, @Body() dto: UpdateOrderDto): Promise<Pedido> {
    return this.orders.update(user.id, dto);
  }

  @Delete('me')
  remove(@CurrentUser() user: Usuario): Promise<{ ok: true }> {
    return this.orders.remove(user.id);
  }
}
