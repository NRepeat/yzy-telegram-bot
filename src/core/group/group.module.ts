import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupService } from './group.service';
import { GroupScene } from './group.scene';

@Module({
  imports: [],
  providers: [PrismaService, GroupService],
  exports: [GroupService],
})
export class GroupModule {}
