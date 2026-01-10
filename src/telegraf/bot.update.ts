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

  @Start()
  async start(ctx: IContext) {
    this.sessionService.resetBotSession(ctx);
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
  @On('my_chat_member')
  async onMyChatMember(@Ctx() ctx: IContext) {
    try {
      const myChatMember = ctx.myChatMember;
      if (!myChatMember) {
        return;
      }
      const status = myChatMember.new_chat_member.status;

      // Проверяем, был ли бот удален или покинул группу
      if (status === 'kicked' || status === 'left') {
        console.log(
          `Бот удален из ${myChatMember.chat.type}: ${myChatMember.chat.id}`,
        );

        // Вызываем ваш сервис для обработки удаления (например, пометить группу как неактивную)
        if (
          myChatMember.chat.type === 'group' ||
          myChatMember.chat.type === 'supergroup'
        ) {
          // Предположим, у вас есть такой метод в GroupService
          await this.groupService.removeGroup(myChatMember.chat.id);
        }
      }
    } catch (error) {
      console.error('Ошибка при обработке my_chat_member:', error);
    }
  }
}
