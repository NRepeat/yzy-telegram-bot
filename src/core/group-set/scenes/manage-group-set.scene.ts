import { Ctx, SceneEnter } from 'nestjs-telegraf';
import { ActionContract, SceneContract } from 'src/shared/decorators';
import { ExtraService } from '../../extra/extra.service';
import { GroupSetService } from '../group-set.service';
import type { IContext } from 'src/shared/interfaces';
import { Markup } from 'telegraf';
import { Prisma } from 'generated/prisma/client';
import { I18nPath } from 'src/shared/types';

@SceneContract('scenes.group_set_manager.manage_selected')
export class ManageGroupSetScene {
  constructor(
    private readonly extra: ExtraService,
    private readonly groupSetService: GroupSetService,
  ) {}

  @SceneEnter()
  async enter(@Ctx() ctx: IContext) {
    const { lang, groupSet } = ctx.session;
    const setId = groupSet?.selectedGroupSetId;

    if (!setId) {
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.set_not_found' as I18nPath, // Localization exists
      });
      await ctx.scene.enter('scenes.group_set_manager.list');
      return;
    }

    const selectedGroupSet = (await this.groupSetService.getGroupSetById(
      setId,
    )) as Prisma.GroupSetGetPayload<{ include: { items: true } }>;

    if (!selectedGroupSet) {
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.set_not_found' as I18nPath,
      });
      await ctx.scene.enter('scenes.group_set_manager.list');
      return;
    }

    const groupNames =
      selectedGroupSet.items.length > 0
        ? selectedGroupSet.items.map((item) => `\`${item.chat_id}\``).join(', ')
        : 'No groups added yet.';

    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.group_set_manager.manage_set_welcome' as I18nPath, // Needs localization
      args: { setName: selectedGroupSet.name, groups: groupNames },
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(
            'buttons.group_set_manager.rename_set' as I18nPath,
            'rename_set',
          ), // Needs localization
          Markup.button.callback(
            'buttons.group_set_manager.delete_set' as I18nPath,
            'delete_set',
          ), // Needs localization
        ],
        [
          Markup.button.callback(
            'buttons.group_set_manager.add_group' as I18nPath,
            'add_group_to_set',
          ), // Needs localization
          Markup.button.callback(
            'buttons.group_set_manager.remove_group' as I18nPath,
            'remove_group_from_set',
          ), // Needs localization
        ],
        [Markup.button.callback('buttons.back' as I18nPath, 'back_to_list')],
      ]),
    });
  }

  @ActionContract('rename_set')
  async onRenameSet(@Ctx() ctx: IContext) {
    // TODO: Implement wizard for renaming set
    await ctx.reply('Rename set functionality to be implemented.');
    return ctx.scene.reenter();
  }

  @ActionContract('delete_set')
  async onDeleteSet(@Ctx() ctx: IContext) {
    await ctx.scene.enter('scenes.group_set_manager.delete_set');
  }

  @ActionContract('add_group_to_set')
  async onAddGroupToSet(@Ctx() ctx: IContext) {
    await ctx.scene.enter('scenes.group_set_manager.add_group');
  }

  @ActionContract('remove_group_from_set')
  async onRemoveGroupFromSet(@Ctx() ctx: IContext) {
    // TODO: Implement wizard for removing group
    await ctx.reply('Remove group from set functionality to be implemented.');
    return ctx.scene.reenter();
  }

  @ActionContract('back_to_list')
  async backToList(@Ctx() ctx: IContext) {
    await ctx.scene.enter('scenes.group_set_manager.list');
  }
}
