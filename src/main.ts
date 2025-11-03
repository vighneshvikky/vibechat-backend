import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config()
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(
    `🚀 Server running in ${isProduction ? 'production' : 'development'} mode`,
  );
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
