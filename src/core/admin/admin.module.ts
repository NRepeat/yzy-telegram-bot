import { Module } from '@nestjs/common';
import { AdminScene } from './admin.scene';
import { ExtraModule } from '../extra/extra.module';

@Module({
  imports: [ExtraModule],
  providers: [AdminScene],
  exports: [AdminScene],
})
export class AdminModule {}
