import { Module } from '@nestjs/common';
import { ExtraService } from './extra.service';
import { SessionModule } from '../session';
import { TranslateModule } from '../translate';

@Module({
  imports: [TranslateModule, SessionModule],
  providers: [ExtraService],
  exports: [ExtraService],
})
export class ExtraModule {}
