import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

// Filtro global: respuestas de error claras SIN filtrar detalles internos (R9, CHK031).
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let code = 'error';
    let message = 'Ocurrió un error';

    if (isHttp) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>;
        if (Array.isArray(obj.message)) {
          message = (obj.message as string[]).join('; ');
        } else if (typeof obj.message === 'string') {
          message = obj.message;
        }
        if (typeof obj.error === 'string') {
          code = obj.error;
        }
      }
    } else {
      // 500: registrar internamente, no exponer al cliente
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    res.status(status).json({ error: { code, message } });
  }
}
