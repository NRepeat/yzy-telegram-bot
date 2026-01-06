import { prisma } from '../../lib/prisma';
import { Telegraf } from 'telegraf';
import { MyContext } from '../types';

export class BroadcastService {
  constructor(private readonly bot: Telegraf<MyContext>) {}

  async createBroadcast(text: string, chatIds: bigint[]) {
    const broadcast = await prisma.broadcast.create({
      data: {
        text,
      },
    });

    for (const chatId of chatIds) {
      const message = await this.bot.telegram.sendMessage(String(chatId), text);
      await prisma.broadcastMessage.create({
        data: {
          broadcastId: broadcast.id,
          chat_id: chatId,
          message_id: message.message_id,
        },
      });
    }

    return broadcast;
  }

  async editBroadcast(broadcastId: number, text: string) {
    const broadcast = await prisma.broadcast.update({
      where: { id: broadcastId },
      data: { text },
      include: {
        messages: true,
      },
    });

    for (const message of broadcast.messages) {
      await this.bot.telegram.editMessageText(
        String(message.chat_id),
        message.message_id,
        undefined,
        text
      );
    }

    return broadcast;
  }
}
