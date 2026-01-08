import { SceneEnter } from 'nestjs-telegraf';
import { ActionContract, SceneContract } from 'src/shared/decorators';
import { ExtraService } from '../extra/extra.service';
import type { IContext } from 'src/shared/interfaces';

@SceneContract('scenes.admin')
export class AdminScene {
  constructor(private readonly extra: ExtraService) {}

  @SceneEnter()
  async enter(ctx: IContext) {
    const { extra } = this;
    const { lang } = ctx.session;

    await extra.replyOrEdit(ctx, lang, {
      text: 'phrases.admin',
      ...extra.typedInlineKeyboard(
        [
          ['buttons.admin.groups', 'buttons.group_set_manager.list'],
          ['buttons.close'],
        ],
        lang,
      ),
    });
  }

  @ActionContract('buttons.group_set_manager.list')
  async toGroupSetManager(ctx: IContext) {
    await ctx.scene.enter('scenes.group_set_manager');
  }

  @ActionContract('buttons.close')
  async backToHome(ctx: IContext) {
    await ctx.deleteMessage();
    await ctx.scene.leave();
  }

  @ActionContract('buttons.admin.groups')
  async toAdminControl(ctx: IContext) {
    await ctx.scene.enter('scenes.groups');
  }
}
