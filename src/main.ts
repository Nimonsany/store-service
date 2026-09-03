import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function validateProductionEnvironment(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const internalSecret = process.env.INTERNAL_SERVICE_SECRET?.trim();

  if (!internalSecret || internalSecret.startsWith('replace-with-')) {
    throw new Error(
      'INTERNAL_SERVICE_SECRET must be configured with a non-placeholder value in production',
    );
  }
}

async function bootstrap() {
  validateProductionEnvironment();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3003);
}

bootstrap();
