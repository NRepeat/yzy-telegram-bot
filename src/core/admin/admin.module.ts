import { Module } from '@nestjs/common';
import { AdminScene } from './admin.scene';
import { ExtraModule } from '../extra/extra.module';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [ExtraModule],
  providers: [AdminScene, AdminService, PrismaService],
  exports: [AdminScene, AdminService],
})
export class AdminModule {}
