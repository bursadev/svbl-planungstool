import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Comma-separated list, like CLERK_AUTHORIZED_PARTIES, so the deployed web
  // app and a local one can share a backend.
  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins });
  configureApp(app);
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
