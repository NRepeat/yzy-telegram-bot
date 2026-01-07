import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getBotToken } from 'nestjs-telegraf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const bot = app.get(getBotToken('yzy-bot'));
  app.use(bot.webhookCallback('/webhook'));
  await app.listen(process.env.PORT ?? 3000);

  // 2. Подключаем обработчик вебхука как middleware.
  // Теперь все POST запросы на /webhook будут уходить в Telegraf.
}
bootstrap();
