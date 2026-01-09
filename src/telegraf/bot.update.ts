import { Ctx, On, Start, Update } from 'nestjs-telegraf';
import { SessionService } from 'src/core/session';
import type { IContext } from 'src/shared/interfaces';
import { GroupService } from 'src/core/group/group.service';
import { AdminService } from 'src/core/admin/admin.service';
import { ExtraService } from 'src/core/extra/extra.service';

@Update()
export class BotUpdate {
  constructor(
    private readonly sessionService: SessionService,
    private readonly groupService: GroupService,
    private readonly adminService: AdminService,
    private readonly extra: ExtraService,
  ) {}
  // @On('message')
  // async onAnyMessage(@Ctx() ctx: IContext) {
  //   const message = ctx.message as any;
  //   console.log('--- НОВОЕ СООБЩЕНИЕ ---');
  //   console.log('Text:', message?.text);
  //   console.log('Chat ID:', ctx.chat?.id);
  //   console.log('Current Scene:', ctx.scene?.current?.id);
  //   console.log('Step:', (ctx as any).wizard?.cursor); // Если вы внутри визарда
  //   console.log('------------------------');
  // }
  @Start()
  async start(ctx: IContext) {
    this.sessionService.resetBotSession(ctx);
    console.log(ctx.chat?.type);
    if (ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup') {
      await this.groupService.upsertGroup(ctx.chat.id, ctx.chat.title || '');
    }
    const authorized = await this.adminService.authorize(ctx);
    if (authorized) {
      await ctx.scene.enter('scenes.home');
    } else {
      const { lang } = ctx.session;
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'alerts.not_admin',
        args: { name: ctx.from?.username },
      });
    }
  }
}
