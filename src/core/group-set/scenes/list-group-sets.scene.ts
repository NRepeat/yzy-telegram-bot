import { Action, Ctx, SceneEnter } from 'nestjs-telegraf';
import { ActionContract, SceneContract } from 'src/shared/decorators';
import { ExtraService } from '../../extra/extra.service';
import { GroupSetService } from '../group-set.service';
import type { IContext } from 'src/shared/interfaces';
import type {
  I18nPath,
  I18nTranslations,
} from 'src/shared/types/translate.types.generated';
import { PathImpl2 } from '@nestjs/config';

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
        ...this.extra.typedInlineKeyboard(
          [[{ text: 'buttons.back' as I18nPath, callback_data: 'back' }]],
          lang,
        ),
      });
      return;
    }

    const buttons: {
      text: PathImpl2<I18nTranslations>;
      callback_data: string;
    }[][] = [];
    for (let i = 0; i < groupSets.length; i += 2) {
      const row = groupSets.slice(i, i + 2).map((set) => ({
        text: set.name as I18nPath,
        callback_data: `select_group_set_${set.id}`,
      }));
      buttons.push(row);
    }
    buttons.push([
      {
        text: 'buttons.back',
        callback_data: 'buttons.back',
      },
    ]);

    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.group_set_manager.set_list',
      args: { username: ctx.from?.username },
      ...this.extra.typedInlineKeyboard(buttons, lang),
    });
  }

  @Action(/select_group_set_(\d+)/)
  async onSelectGroupSet(@Ctx() ctx: IContext) {
    const match = (ctx.callbackQuery as any).data.match(
      /select_group_set_(\d+)/,
    );
    const setId = parseInt(match[1], 10);

    if (!ctx.session.groupSet) {
      ctx.session.groupSet = { selectedChatIds: [] };
    }
    ctx.session.groupSet.selectedGroupSetId = setId;

    await ctx.scene.enter('scenes.group_set_manager.manage_selected');
  }

  @ActionContract('buttons.back')
  async backToGroupSetManager(@Ctx() ctx: IContext) {
    console.log(ctx);
    await ctx.scene.enter('scenes.group_set_manager');
  }
}
