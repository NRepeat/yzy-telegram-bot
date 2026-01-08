import { SceneEnter } from 'nestjs-telegraf';
import { ActionContract, SceneContract } from 'src/shared/decorators';
import { ExtraService } from '../extra/extra.service';
import type { IContext } from 'src/shared/interfaces';

@SceneContract('scenes.group_set_manager')
export class GroupSetScene {
  constructor(private readonly extra: ExtraService) {}

  @SceneEnter()
  async enter(ctx: IContext) {
    const { extra } = this;
    const { lang } = ctx.session;

    if (!ctx.session.groupSet) {
      ctx.session.groupSet = {
        selectedGroupSetId: undefined,
        selectedChatIds: [],
      };
    }

    await extra.replyOrEdit(ctx, lang, {
      text: 'phrases.group_set_manager.welcome',

      ...extra.typedInlineKeyboard(
        [
          [
            'buttons.group_set_manager.create',
            'buttons.group_set_manager.list',
          ],
          ['buttons.group_set_manager.back'],
        ],
        lang,
      ),
    });
  }

  @ActionContract('buttons.group_set_manager.create')
  async createGroupSet(ctx: IContext) {
    await ctx.scene.enter('scenes.group_set_manager.create');
  }

  @ActionContract('buttons.group_set_manager.list')
  async listGroupSets(ctx: IContext) {
    await ctx.scene.enter('scenes.group_set_manager.list');
  }

  @ActionContract('buttons.group_set_manager.back')
  async backToHome(ctx: IContext) {
    console.log('backToHome');
    await ctx.scene.enter('scenes.admin');
  }
}
