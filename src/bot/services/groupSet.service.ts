import { prisma } from '../../lib/prisma';

export class GroupSetService {
  async getGroupSets() {
    return prisma.groupSet.findMany({
      include: {
        items: true,
      },
    });
  }

  async createGroupSet(name: string, chatIds: bigint[]) {
    return prisma.groupSet.create({
      data: {
        name,
        items: {
          create: chatIds.map((chat_id) => ({ chat_id })),
        },
      },
    });
  }
}
