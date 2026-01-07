import { Start, Update } from 'nestjs-telegraf';
import { SessionService } from 'src/core/session';
import type { IContext } from 'src/shared/interfaces';
import { GroupService } from 'src/core/group/group.service';

@Update()
export class BotUpdate {
  constructor(
    private readonly sessionService: SessionService,
    private readonly groupService: GroupService,
  ) {}

  @Start()
  async start(ctx: IContext) {
    this.sessionService.resetBotSession(ctx);

    if (ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup') {
      await this.groupService.upsertGroup(ctx.chat.id, ctx.chat.title || '');
    }

    await ctx.scene.enter('scenes.home');
  }
}
