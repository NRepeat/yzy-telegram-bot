import { prisma } from '../../lib/prisma';

export class GroupService {
  async getGroups() {
    return prisma.group.findMany();
  }

  async createOrUpdateGroup(chatId: bigint, title: string) {
    return prisma.group.upsert({
      where: { chat_id: chatId },
      update: { title },
      create: { chat_id: chatId, title },
    });
  }
}
