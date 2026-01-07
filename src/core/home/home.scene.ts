import { SceneEnter } from 'nestjs-telegraf';
import { ActionContract, SceneContract } from 'src/shared/decorators';
import { ExtraService } from '../extra/extra.service';
import type { IContext } from 'src/shared/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';

@SceneContract('scenes.home')
export class HomeScene {
  constructor(
    private readonly extra: ExtraService,
    private readonly prisma: PrismaService,
  ) {}

  @SceneEnter()
  async start(ctx: IContext) {
    const { extra } = this;
    const { lang } = ctx.session;

    await extra.replyOrEdit(ctx, lang, {
      text: 'phrases.home',
      args: { username: ctx.from?.username },
      ...extra.typedInlineKeyboard([[{ text: 'buttons.admin.home' }]], lang),
    });
  }

  @ActionContract('buttons.admin.home')
  async toAdminPanel(ctx: IContext) {
    await ctx.scene.enter('scenes.admin');
  }

  @ActionContract('buttons.faq')
  async toFAQ(ctx: IContext) {
    await ctx.scene.enter('scenes.faq');
  }

  @ActionContract('buttons.change_language')
  async toChangeLanguage(ctx: IContext) {
    await ctx.scene.enter('scenes.group_set_manager');
  }
}
