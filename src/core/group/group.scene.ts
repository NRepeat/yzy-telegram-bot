import { Action, On, SceneEnter, Ctx } from 'nestjs-telegraf';
import { SceneContract } from 'src/shared/decorators';
import type { IContext } from 'src/shared/interfaces';
import { GroupService } from './group.service';

@SceneContract('scenes.groups')
export class GroupScene {
  constructor(private readonly groupService: GroupService) {}

  @SceneEnter()
  async enter(@Ctx() ctx: IContext) {
    const { groupSet } = ctx.session;
    const selectedChatIds = groupSet?.selectedChatIds || [];
    const fromManageStep = groupSet?.fromManageStep || false;
    if (!ctx.scene.state.groups) {
      ctx.scene.state.groups = {
        selected: selectedChatIds ? selectedChatIds : [],
        activeSets: [],
      };
    }
    ctx.scene.state.step = '';
    await this.render(ctx, fromManageStep);
  }

  private getSelected(ctx: IContext): string[] {
    if (!ctx.scene.state.groups.selected) {
      ctx.scene.state.groups.selected = [];
    }
    return ctx.scene.state.groups.selected;
  }

  private async render(ctx: IContext, fromManageStep?: boolean) {
    const groups = await this.groupService.getAllGroups({});
    const selected = this.getSelected(ctx);

    const keyboard = groups.map((g) => {
      const gId = g.chat_id.toString();
      const isSelected = selected
        .map((s) => s.toString())
        .includes(String(gId.toString()));
      return [
        {
          text: `${isSelected ? '☑️' : '⬜'} ${g.title}`,
          callback_data: `group_${gId}`,
        },
      ];
    });
    if (fromManageStep) {
      keyboard.push([
        { text: '📥+ Добавить в сет', callback_data: 'add_to_set' },
      ]);
    } else {
      keyboard.push(
        [{ text: '🚀 Отправить', callback_data: 'send' }],
        [
          { text: '📥+ Добавить в сет', callback_data: 'add_to_set' },

          { text: '📁+ Создать сет', callback_data: 'creat_set' },
        ],
      );
    }

    keyboard.push([{ text: '❌ Отмена', callback_data: 'cancel' }]);

    const messageText = `<b>Меню рассылки</b>\n\nВыбрано групп: <b>${selected.length}</b>\nВыберите группы из списка ниже и нажмите "Отправить".`;

    if (ctx.updateType === 'callback_query' && !false) {
      try {
        await ctx.editMessageText(messageText, {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard },
        });
        if (
          ctx.scene.state.lastMenuId &&
          ctx.callbackQuery.message?.message_id
        ) {
          ctx.scene.state.lastMenuId.push(
            ctx.callbackQuery.message?.message_id,
          );
        }
      } catch (err: any) {
        if (!err?.response?.description?.includes('message is not modified')) {
          console.error('Render error:', err);
        }
      }
    } else {
      const sentMsg = await ctx.reply(messageText, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard },
      });

      if (ctx.scene.state.lastMenuId) {
        ctx.scene.state.lastMenuId.push(sentMsg.message_id);
      }
    }
  }

  @Action(/group_(-?\d+)/)
  async toggleGroup(@Ctx() ctx: IContext) {
    const match = (ctx.callbackQuery as any).data.match(/group_(-?\d+)/);
    const chatId = match[1];
    const selected = this.getSelected(ctx);

    const index = selected.indexOf(chatId);

    if (!ctx.session.groupSet) {
      ctx.session.groupSet = { selectedChatIds: [] };
    }
    const sessionIds = ctx.session.groupSet.selectedChatIds;
    if (index > -1) {
      selected.splice(index, 1);
      ctx.session.groupSet.selectedChatIds = sessionIds.filter(
        (id) => id !== chatId,
      );
    } else {
      selected.push(chatId);
      const uniqueSet = new Set([...sessionIds, chatId]);
      ctx.session.groupSet.selectedChatIds = Array.from(uniqueSet);
    }

    await ctx.answerCbQuery();
    await this.render(ctx);
  }

  @Action('send')
  async send(@Ctx() ctx: IContext) {
    const selected = this.getSelected(ctx);

    if (selected.length === 0) {
      await ctx.answerCbQuery(
        '⚠️ Сначала выберите хотя бы одну группу!',
        // { show_alert: true },
      );
      return;
    } else {
      ctx.scene.state.step = 'enter_text';
      await ctx.answerCbQuery();
      const message = await ctx.reply(
        '📝 Введите текст сообщения для рассылки:',
      );
      if (ctx.scene.state.lastMenuId) {
        ctx.scene.state.lastMenuId.push(message.message_id);
      }
    }
  }

  @On('text')
  async onText(@Ctx() ctx: IContext) {
    if (ctx.scene.state.step !== 'enter_text') return;

    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : null;
    if (!text) return ctx.reply('Пожалуйста, отправьте именно текст.');

    const selected = this.getSelected(ctx);

    for (const chatId of selected) {
      try {
        await ctx.telegram.sendMessage(Number(chatId), text);
      } catch (e) {
        console.error(e);
      }
    }

    await ctx.reply(`✅ Рассылка в ${selected.length} групп завершена!`);

    ctx.scene.state.groups.selected = [];
    ctx.scene.state.step = '';
    if (ctx.session.groupSet?.selectedChatIds) {
      ctx.session.groupSet.selectedChatIds = [];
    }
    try {
      if (ctx.scene.state.lastMenuId && ctx.scene.state.lastMenuId.length > 0) {
        try {
          for (const id of ctx.scene.state.lastMenuId) {
            if (ctx.chat?.id) {
              await ctx.telegram.deleteMessage(ctx.chat?.id, id);
            }
          }
        } catch (e) {
          console.error('Не удалось удалить старое меню:', e);
        }
      }
      await ctx.deleteMessage();
    } catch (e) {
      console.error('Не удалось удалить сообщение:', e);
    }

    return await ctx.scene.reenter();
  }

  @Action('cancel')
  async cancel(@Ctx() ctx: IContext) {
    await ctx.answerCbQuery();
    ctx.scene.state.groups.selected = [];
    ctx.scene.state.step = '';
    const fromManageStep = ctx.session.groupSet?.fromManageStep;
    if (ctx.session.groupSet?.selectedChatIds) {
      ctx.session.groupSet.selectedChatIds = [];
      ctx.session.groupSet.fromManageStep = false;
    }
    ctx.scene.state.lastMenuId = undefined;
    if (fromManageStep) {
      return await ctx.scene.enter('scenes.group_set_manager.manage_selected');
    }
    return await ctx.scene.enter('scenes.admin');
  }
  @Action('add_to_set')
  async add_to_set(@Ctx() ctx: IContext) {
    if (!ctx.session.groupSet?.selectedChatIds) {
      await ctx.answerCbQuery(
        '⚠️ Сначала выберите хотя бы одну группу!',
        // { show_alert: true },
      );
      return;
    }
    if (
      ctx.session.groupSet?.selectedChatIds &&
      ctx.session.groupSet?.selectedChatIds?.length === 0
    ) {
      await ctx.answerCbQuery(
        '⚠️ Сначала выберите хотя бы одну группу!',
        // { show_alert: true },
      );
      return;
    }
    return await ctx.scene.enter('scenes.group_set_manager.add_to_set');
  }

  @Action('creat_set')
  async creat_set(@Ctx() ctx: IContext) {
    await ctx.answerCbQuery();
    if (!ctx.session.groupSet?.selectedChatIds) {
      await ctx.answerCbQuery(
        '⚠️ Сначала выберите хотя бы одну группу!',
        // { show_alert: true },
      );
      return;
    }
    if (
      ctx.session.groupSet?.selectedChatIds &&
      ctx.session.groupSet?.selectedChatIds?.length === 0
    ) {
      await ctx.answerCbQuery(
        '⚠️ Сначала выберите хотя бы одну группу!',
        // { show_alert: true },
      );
      return;
    }
    await ctx.answerCbQuery();

    return await ctx.scene.enter('scenes.group_set_manager.create');
  }
}
