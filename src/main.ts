import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn', 'debug'] });

  // ── Global Validation Pipe ──────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,          // Auto-transform primitives
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global Exception Filter ─────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Prefix & CORS ───────────────────────────────────────
  app.setGlobalPrefix('api/v1');
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Metal Trading API running on http://localhost:${port}/api/v1`);
}

bootstrap();
