import { Injectable } from '@nestjs/common';
import { Group, GroupSet, GroupSetItem } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GroupSetService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroupSet(name: string): Promise<GroupSet> {
    return this.prisma.groupSet.create({
      data: { name },
    });
  }

  async getGroupSetById(
    id: number,
  ): Promise<{ groupSet: GroupSet | null; groups: Group[] | null }> {
    const groupSet = await this.prisma.groupSet.findUnique({
      where: { id },
      include: { items: true },
    });
    const groups = await this.prisma.group.findMany({
      where: {
        chat_id: { in: groupSet?.items.map((item) => item.chat_id) },
      },
    });
    return { groupSet, groups };
  }

  async getGroupSetByName(name: string): Promise<GroupSet | null> {
    return this.prisma.groupSet.findUnique({
      where: { name },
      include: { items: true },
    });
  }

  async getAllGroupSets(): Promise<GroupSet[]> {
    return this.prisma.groupSet.findMany({
      include: { items: true },
    });
  }

  async addGroupToSet(setId: number, chat_id: bigint): Promise<GroupSetItem> {
    // Check if the group already exists in the set to prevent duplicates
    const existingItem = await this.prisma.groupSetItem.findFirst({
      where: { setId, chat_id },
    });

    if (existingItem) {
      // Potentially throw an error or handle as a no-op
      throw new Error(`Group ${chat_id} is already in set ${setId}`);
    }

    return this.prisma.groupSetItem.create({
      data: {
        setId,
        chat_id,
      },
    });
  }

  async removeGroupFromSet(setId: number, chat_id: bigint): Promise<void> {
    await this.prisma.groupSetItem.deleteMany({
      where: {
        setId,
        chat_id,
      },
    });
  }

  async deleteGroupSet(id: number): Promise<GroupSet> {
    // Delete all items first due to foreign key constraint
    await this.prisma.groupSetItem.deleteMany({
      where: { setId: id },
    });
    return this.prisma.groupSet.delete({
      where: { id },
    });
  }

  async updateGroupSetName(id: number, newName: string): Promise<GroupSet> {
    return this.prisma.groupSet.update({
      where: { id },
      data: { name: newName },
    });
  }

  async getGroupsInSet(setId: number): Promise<GroupSetItem[]> {
    return this.prisma.groupSetItem.findMany({
      where: { setId },
    });
  }
}
