import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from './telegraf/bot.module';
@Module({
  imports: [ConfigModule.forRoot({}), BotModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
