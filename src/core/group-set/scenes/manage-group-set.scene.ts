import { Action, Ctx, On, SceneEnter } from 'nestjs-telegraf';
import { ActionContract, SceneContract } from 'src/shared/decorators';
import { ExtraService } from '../../extra/extra.service';
import { GroupSetService } from '../group-set.service';
import type { IContext } from 'src/shared/interfaces';
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

    const selectedGroupSet = await this.groupSetService.getGroupSetById(setId);
    if (!selectedGroupSet) {
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.set_not_found' as I18nPath,
      });
      await ctx.scene.enter('scenes.group_set_manager.list');
      return;
    }

    const groupNames =
      selectedGroupSet.groups && selectedGroupSet.groups?.length > 0
        ? selectedGroupSet.groups?.map((item) => `\`${item.title}\``).join(', ')
        : 'No groups added yet.';

    const keyboard = [
      [
        {
          text: 'buttons.group_set_manager.rename_set' as I18nPath,
          callback_data: 'rename_set',
        },
        {
          text: 'buttons.group_set_manager.delete_set' as I18nPath,
          callback_data: 'delete_set',
        },
      ],
      [
        {
          text: 'buttons.group_set_manager.add_group' as I18nPath,
          callback_data: 'add_group_to_set',
        },
        {
          text: 'buttons.group_set_manager.remove_group' as I18nPath,
          callback_data: 'remove_group_from_set',
        },
      ],
    ];
    if (selectedGroupSet.groups && selectedGroupSet.groups?.length > 0) {
      keyboard.push([
        { text: 'buttons.send' as I18nPath, callback_data: 'send' },
      ]);
    }
    keyboard.push([
      { text: 'buttons.back' as I18nPath, callback_data: 'back_to_list' },
    ]);
    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.group_set_manager.manage_set_welcome' as I18nPath, // Needs localization
      args: { setName: selectedGroupSet.groupSet?.name, groups: groupNames },
      ...this.extra.typedInlineKeyboard(keyboard, lang),
    });
  }
  @Action('send')
  async send(@Ctx() ctx: IContext) {
    ctx.scene.state.step = 'enter_text';
    await ctx.answerCbQuery();
    await ctx.reply('📝 Введите текст сообщения для рассылки:');
  }

  @On('text')
  async onText(@Ctx() ctx: IContext) {
    if (ctx.scene.state.step !== 'enter_text') return;

    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : null;
    if (!text) return ctx.reply('Пожалуйста, отправьте именно текст.');
    const { groupSet } = ctx.session;
    const setId = groupSet?.selectedGroupSetId;
    if (!setId) {
      await ctx.scene.reenter();
      return;
    }
    const groupIds = await this.groupSetService.getGroupSetById(setId);
    if (!groupIds.groups) {
      await ctx.reply('В этом сете нет груп');
      await ctx.scene.reenter();
      return;
    }
    if (groupIds.groups?.length === 0) {
      await ctx.reply('В этом сете нет груп');
      await ctx.scene.reenter();
      return;
    }
    for (const chatId of groupIds.groups) {
      try {
        await ctx.telegram.sendMessage(Number(chatId.chat_id), text);
      } catch (e) {
        console.error(e);
      }
    }

    try {
      await ctx.deleteMessage();
    } catch (e) {
      console.error('Error deleting message:', e);
    }

    await ctx.reply(`✅ Рассылка в ${groupIds.groups.length} групп завершена!`);

    ctx.scene.state.step = '';
    return await ctx.scene.reenter();
  }
  @ActionContract('rename_set')
  async onRenameSet(@Ctx() ctx: IContext) {
    await ctx.reply('Rename set functionality to be implemented.');
    return ctx.scene.reenter();
  }

  @ActionContract('delete_set')
  async onDeleteSet(@Ctx() ctx: IContext) {
    await ctx.scene.enter('scenes.group_set_manager.delete_set');
  }

  @ActionContract('add_group_to_set')
  async onAddGroupToSet(@Ctx() ctx: IContext) {
    if (!ctx.session.groupSet) {
      ctx.session.groupSet = {
        selectedChatIds: [],
        fromManageStep: true,
      };
    }
    await ctx.scene.enter('scenes.groups');
  }

  @ActionContract('remove_group_from_set')
  async onRemoveGroupFromSet(@Ctx() ctx: IContext) {
    const setId = ctx.session.groupSet?.selectedGroupSetId;
    if (!setId) return ctx.scene.enter('scenes.group_set_manager.list');

    // Переходим в специальную сцену удаления
    return await ctx.scene.enter('scenes.group_set_manager.remove_groups');
  }

  @ActionContract('back_to_list')
  async backToList(@Ctx() ctx: IContext) {
    await ctx.scene.enter('scenes.group_set_manager.list');
  }
}
