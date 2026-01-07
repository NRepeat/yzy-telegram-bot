import { Module } from '@nestjs/common';
import { ExtraService } from './extra.service';
import { TranslateModule } from '../translate';
import { SessionModule } from '../session';

@Module({
  imports: [TranslateModule, SessionModule],
  providers: [ExtraService],
  exports: [ExtraService],
})
export class ExtraModule {}
