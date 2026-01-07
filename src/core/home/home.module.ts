import { Module } from '@nestjs/common';
import { HomeScene } from './home.scene';
import { ExtraModule } from '../extra';
import { TranslateModule } from '../translate';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [ExtraModule, TranslateModule],
  providers: [HomeScene, PrismaService],
  exports: [HomeScene],
})
export class HomeModule {}
