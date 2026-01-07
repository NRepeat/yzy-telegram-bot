import { Start, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { SessionService } from 'src/core/session';
import type { IContext } from 'src/shared/interfaces';

@Update()
export class BotUpdate {
  constructor(private readonly sessionService: SessionService) {}

  @Start()
  async start(ctx: IContext) {
    this.sessionService.resetBotSession(ctx);
    Logger.verbose(ctx.session, `SESSION - START`);

    await ctx.scene.enter('scenes.home');
  }
}
