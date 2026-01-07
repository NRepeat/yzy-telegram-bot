import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { IContext } from 'src/shared/interfaces/context.abstract';
import { type IBotContext } from 'src/shared/interfaces/context.bot';
import { InlineKeyboardMarkup, ReplyKeyboardMarkup } from 'telegraf/types';

@Injectable()
export class BotService {
  constructor(@InjectBot('yzy-bot') private readonly bot: IBotContext) {}

  async sendMessage(
    ctx: IContext,
    text: string,
    keyboard: { reply_markup: InlineKeyboardMarkup | ReplyKeyboardMarkup },
  ) {
    const chat = ctx.chat;
    const chatId = chat?.id;
    if (!chatId) {
      throw new Error('Chat id not found');
    }
    await this.bot.telegram.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      ...keyboard,
    });
  }
}
