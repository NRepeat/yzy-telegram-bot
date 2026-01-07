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
          ['buttons.admin.control', 'buttons.group_set_manager.list'], // Placeholder, assuming control is another admin function
          ['buttons.back'],
        ],
        lang,
      ),
    });
  }

  @ActionContract('buttons.group_set_manager.list')
  async toGroupSetManager(ctx: IContext) {
    await ctx.scene.enter('scenes.group_set_manager');
  }

  @ActionContract('buttons.back')
  async backToHome(ctx: IContext) {
    await ctx.scene.enter('scenes.home');
  }

  // TODO: Add other admin actions
  @ActionContract('buttons.admin.control')
  async toAdminControl(ctx: IContext) {
    await ctx.reply('Admin control functionality goes here...');
    // Potentially enter another admin-specific scene
  }
}
