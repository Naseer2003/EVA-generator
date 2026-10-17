import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Response compression ──────────────────────────────────────────────────
  // EVA results are large arrays of numbers — a 1140-tube run stores roughly
  // 400 KB of plot data in EvaRun.result, and the results page fetches all of
  // it. Measured: that payload gzips to ~86 KB, a 79% reduction. Unlike the
  // backend -> engine hop (loopback, where compressing costs more CPU than it
  // saves) this one crosses a real network to the browser, so it is a clear
  // win: on a 10 Mbps link it is the difference between ~320 ms and ~70 ms.
  app.use(compression({ threshold: 1024 }));

  // ── Global Validation Pipe ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,           // auto-transform types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // ── Global API Prefix ─────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\n🚀  EVA Backend running at http://localhost:${port}/api/v1`);
}

bootstrap();
