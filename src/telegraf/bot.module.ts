import 'reflect-metadata';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module, NotFoundException } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';
import { HomeModule } from 'src/core/home';
import { SessionService } from 'src/core/session';
import { PostgresAdapter } from 'kysely';
import { Postgres } from '@telegraf/session/pg';
import { session } from 'telegraf';
// import { session } from 'telegraf';

const store = (config: ConfigService) => {
  return Postgres<PostgresAdapter>({
    database: config.get<string>('DATABASE_NAME') || '',
    host: config.get<string>('DATABASE_HOST') || '',
    user: config.get<string>('DATABASE_USER') || '',
    password: config.get<string>('DATABASE_PASS') || '',
    port: config.get<number>('DATABASE_PORT') || 5432,
    onInitError(err) {
      throw new NotFoundException(`Config value in not found`, err as string);
    },
  });
};
console.log(store);
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRootAsync({
      botName: 'yzy-bot',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        console.log(config);
        return {
          token: config.get<string>('TELEGRAM_BOT_TOKEN') || '',
          middlewares: [session({ store: store(config) })],
          include: [BotModule],
          launchOptions: {
            webhook: {
              domain: 'close-dane-shining.ngrok-free.app',
              hookPath: '/webhook',
            },
          },
        };
      },
    }),
    // ChangeLanguageModule,
    // InfoModule,
    HomeModule,
    // AdminModule,
  ],
  controllers: [BotController],
  providers: [BotService, BotUpdate, SessionService],
})
export class BotModule {}
