import { SceneEnter } from 'nestjs-telegraf';
import { ActionContract, SceneContract } from 'src/shared/decorators';
import { ExtraService } from '../extra/extra.service';
import type { IContext } from 'src/shared/interfaces';

@SceneContract('scenes.home')
export class HomeScene {
  constructor(private readonly extra: ExtraService) {}

  @SceneEnter()
  async start(ctx: IContext) {
    await ctx.scene.enter('scenes.admin');
    // const { extra } = this;

    // const { lang } = ctx.session;

    // await this.extra.replyOrEdit(ctx, lang, {
    //   text: 'phrases.home',
    //   args: { username: ctx.from?.username },
    //   ...extra.typedInlineKeyboard(
    //     [[{ text: 'buttons.admin.home' }], [{ text: 'buttons.close' }]],
    //     lang,
    //   ),
    // });
  }

  @ActionContract('buttons.admin.home')
  async toAdminPanel(ctx: IContext) {
    await ctx.scene.enter('scenes.admin');
  }

  @ActionContract('buttons.close')
  async leaveScene(ctx: IContext) {
    await ctx.deleteMessage();
    await ctx.scene.leave();
  }
}
