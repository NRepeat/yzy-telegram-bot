import { Module } from '@nestjs/common';
import { GroupSetService } from './group-set.service';
import { GroupSetScene } from './group-set.scene';
import { ExtraModule } from '../extra/extra.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [ExtraModule],
  providers: [GroupSetService, GroupSetScene, PrismaService],
  exports: [GroupSetService, GroupSetScene],
})
export class GroupSetModule {}
