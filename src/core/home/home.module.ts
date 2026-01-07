import { Module } from '@nestjs/common';
import { HomeScene } from './home.scene';
import { ExtraModule } from '../extra';
import { TranslateModule } from '../translate';

@Module({
  imports: [ExtraModule, TranslateModule],
  providers: [HomeScene],
  exports: [HomeScene],
})
export class HomeModule {}
