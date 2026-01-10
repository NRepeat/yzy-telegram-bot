import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { GroupWhereInput } from 'generated/prisma/models/Group';

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  async removeGroup(id: number) {
    return this.prisma.group.delete({
      where: {
        chat_id: BigInt(id),
      },
    });
  }

  async getAllGroups({ where }: { where?: GroupWhereInput }) {
    return this.prisma.group.findMany({ where });
  }

  async upsertGroup(id: number, title: string) {
    return this.prisma.group.upsert({
      where: {
        chat_id: BigInt(id),
      },
      update: {
        title: title,
      },
      create: {
        chat_id: BigInt(id),
        title: title,
      },
    });
  }
}
