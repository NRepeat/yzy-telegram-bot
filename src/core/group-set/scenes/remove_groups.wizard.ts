import { Action, Ctx, SceneEnter } from 'nestjs-telegraf';
import { SceneContract } from 'src/shared/decorators';
import { GroupSetService } from '../group-set.service';
import { ExtraService } from '../../extra/extra.service';
import type { IContext } from 'src/shared/interfaces';
import { ButtonsStack, I18nPath } from 'src/shared/types';

@SceneContract('scenes.group_set_manager.remove_groups')
export class RemoveGroupsScene {
  constructor(
    private readonly groupSetService: GroupSetService,
    private readonly extra: ExtraService,
  ) {}

  @SceneEnter()
  async enter(@Ctx() ctx: IContext) {
    await this.render(ctx);
  }

  private async render(ctx: IContext) {
    const setId = ctx.session.groupSet?.selectedGroupSetId;
    const { lang } = ctx.session;

    const selectedGroupSet = await this.groupSetService.getGroupSetById(setId!);
    const groups = selectedGroupSet?.groups || [];

    if (groups.length === 0) {
      await ctx.reply('В этом сете пока нет групп.');
      return ctx.scene.enter('scenes.group_set_manager.manage_selected');
    }

    const buttons: ButtonsStack = groups.map((g) => [
      {
        text: `🗑 ${g.title}` as I18nPath,
        callback_data: `confirm_remove_${g.chat_id}`,
      },
    ]);

    buttons.push([{ text: '⬅️ Назад' as I18nPath, callback_data: 'back' }]);

    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.group_set_manager.select_group_to_remove',
      ...this.extra.typedInlineKeyboard(buttons, lang),
    });
  }

  @Action(/confirm_remove_(-?\d+)/)
  async removeGroup(@Ctx() ctx: IContext) {
    const match = (ctx.callbackQuery as any).data.match(
      /confirm_remove_(-?\d+)/,
    );
    const chatId = match[1];
    const setId = ctx.session.groupSet?.selectedGroupSetId;

    try {
      await this.groupSetService.removeGroupFromSet(setId!, chatId);

      await ctx.answerCbQuery('✅ Группа удалена из сета');
      await this.render(ctx);
    } catch (e) {
      console.error(e);
      await ctx.answerCbQuery('❌ Ошибка при удалении');
    }
  }

  @Action('back')
  async back(@Ctx() ctx: IContext) {
    await ctx.answerCbQuery();
    return await ctx.scene.enter('scenes.group_set_manager.manage_selected');
  }
}
