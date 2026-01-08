import { SceneEnter } from 'nestjs-telegraf';
import { ActionContract, SceneContract } from 'src/shared/decorators';
import { ExtraService } from '../extra/extra.service';
import type { IContext } from 'src/shared/interfaces';
import { GroupSetService } from './group-set.service';

@SceneContract('scenes.group_set_manager')
export class GroupSetScene {
  constructor(
    private readonly extra: ExtraService,
    private readonly groupSetService: GroupSetService,
  ) {}

  @SceneEnter()
  async enter(ctx: IContext) {
    const { extra } = this;
    const { lang } = ctx.session;

    // Initialize session state for groupSet if it doesn't exist
    if (!ctx.session.groupSet) {
      ctx.session.groupSet = {
        selectedGroupSetId: undefined,
        selectedChatIds: [],
      };
    }
    const groupSets = ctx.session.groupSet.selectedChatIds || [];
    const groupSetNames = groupSets.map((gs) => gs).join(', ');

    await extra.replyOrEdit(ctx, lang, {
      text: 'phrases.group_set_manager.welcome',
      args: { groupSetNames: groupSetNames || 'none' },
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
    await ctx.scene.enter('scenes.home');
  }

}
