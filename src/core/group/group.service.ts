import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

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
