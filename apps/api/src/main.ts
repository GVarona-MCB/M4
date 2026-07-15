import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // CORS con credenciales para que la Web (otro puerto) pueda enviar la cookie de sesión.
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3002',
    credentials: true,
  });
  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API escuchando en http://localhost:${port}`);
}

void bootstrap();
