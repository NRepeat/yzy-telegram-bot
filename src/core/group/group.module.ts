import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupService } from './group.service';
import { GroupScene } from './group.scene';
import { ExtraModule } from '../extra';

@Module({
  imports: [ExtraModule],
  providers: [PrismaService, GroupService, GroupScene],
  exports: [GroupService, GroupScene],
})
export class GroupModule {}
