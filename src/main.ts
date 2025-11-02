import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import * as cookieParser from 'cookie-parser'


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser())

  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true
  })
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
