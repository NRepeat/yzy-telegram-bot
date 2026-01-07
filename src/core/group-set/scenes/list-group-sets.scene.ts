import { Action, Ctx, SceneEnter } from 'nestjs-telegraf';
import { ActionContract, SceneContract } from 'src/shared/decorators';
import { ExtraService } from '../../extra/extra.service';
import { GroupSetService } from '../group-set.service';
import type { IContext } from 'src/shared/interfaces';
import type { I18nPath } from 'src/shared/types/translate.types.generated';
import { Markup } from 'telegraf';

@SceneContract('scenes.group_set_manager.list')
export class ListGroupSetsScene {
  constructor(
    private readonly extra: ExtraService,
    private readonly groupSetService: GroupSetService,
  ) {}

  @SceneEnter()
  async enter(@Ctx() ctx: IContext) {
    const { lang } = ctx.session;
    const groupSets = await this.groupSetService.getAllGroupSets();

    if (groupSets.length === 0) {
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.no_sets_found' as I18nPath,
        ...Markup.inlineKeyboard([
          [Markup.button.callback('buttons.back' as I18nPath, 'back')],
        ]),
      });
      return;
    }

    const buttons = groupSets.map((set) =>
      Markup.button.callback(set.name, `select_group_set_${set.id}`),
    );

    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.group_set_manager.set_list' as I18nPath,
      args: {
        list:
          groupSets.map((set) => `- ${set.name}`).join('\n') ||
          ('phrases.group_set_manager.no_sets_found' as I18nPath),
      },
      ...Markup.inlineKeyboard([
        ...buttons.map((btn) => [btn]), // Each button on a new line
        [Markup.button.callback('buttons.back' as I18nPath, 'back')],
      ]),
    });
  }

  // Action handler for selecting a group set
  @Action(/select_group_set_(\d+)/)
  async onSelectGroupSet(@Ctx() ctx: IContext) {
    const match = (ctx.callbackQuery as any).data.match(
      /select_group_set_(\d+)/,
    );
    const setId = parseInt(match[1], 10);

    // Store the selected group set ID in session for further actions
    if (!ctx.session.groupSet) {
      ctx.session.groupSet = { selectedChatIds: [] };
    }
    ctx.session.groupSet.selectedGroupSetId = setId;

    await ctx.scene.enter('scenes.group_set_manager.manage_selected');
  }

  @ActionContract('buttons.back')
  async backToGroupSetManager(@Ctx() ctx: IContext) {
    await ctx.scene.enter('scenes.group_set_manager');
  }
}
