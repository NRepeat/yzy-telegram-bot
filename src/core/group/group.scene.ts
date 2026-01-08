import { Action, On, SceneEnter, Ctx } from 'nestjs-telegraf';
import { SceneContract } from 'src/shared/decorators';
import { ExtraService } from '../extra/extra.service';
import type { IContext } from 'src/shared/interfaces';
import { GroupService } from './group.service';

@SceneContract('scenes.groups')
export class GroupScene {
  constructor(
    private readonly extra: ExtraService,
    private readonly groupService: GroupService,
  ) {}

  @SceneEnter()
  async enter(@Ctx() ctx: IContext) {
    // Инициализация стейта, если его нет
    if (!ctx.scene.state.groups) {
      ctx.scene.state.groups = {
        selected: [],
        activeSets: [],
      };
    }
    ctx.scene.state.step = '';
    await this.render(ctx);
  }

  private getSelected(ctx: IContext): string[] {
    if (!ctx.scene.state.groups.selected) {
      ctx.scene.state.groups.selected = [];
    }
    return ctx.scene.state.groups.selected;
  }

  private async render(ctx: IContext, forceNew: boolean = false) {
    const groups = await this.groupService.getAllGroups({});
    const selected = this.getSelected(ctx);

    const keyboard = groups.map((g) => {
      const gId = g.chat_id.toString();
      const isSelected = selected.includes(gId);
      return [
        {
          text: `${isSelected ? '☑️' : '⬜'} ${g.title}`,
          callback_data: `group_${gId}`,
        },
      ];
    });

    keyboard.push([
      { text: '🚀 Отправить всем выбранным', callback_data: 'send' },
      { text: '📁+ Создать сет', callback_data: 'creat_set' },
    ]);
    keyboard.push([{ text: '❌ Отмена', callback_data: 'cancel' }]);

    const messageText = `<b>Меню рассылки</b>\n\nВыбрано групп: <b>${selected.length}</b>\nВыберите группы из списка ниже и нажмите "Отправить".`;

    if (ctx.updateType === 'callback_query' && !forceNew) {
      try {
        await ctx.editMessageText(messageText, {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard },
        });
        ctx.scene.state.lastMenuId = ctx.callbackQuery.message?.message_id;
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
      ctx.scene.state.lastMenuId = sentMsg.message_id;
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
      await ctx.reply('📝 Введите текст сообщения для рассылки:');
    }
  }

  @On('text')
  async onText(@Ctx() ctx: IContext) {
    if (ctx.scene.state.step !== 'enter_text') return;

    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : null;
    if (!text) return ctx.reply('Пожалуйста, отправьте именно текст.');

    const selected = this.getSelected(ctx);

    if (ctx.scene.state.lastMenuId) {
      try {
        await ctx.telegram.deleteMessage(
          ctx.chat?.id!,
          ctx.scene.state.lastMenuId,
        );
      } catch (e) {
        console.error('Не удалось удалить старое меню:', e);
      }
    }

    for (const chatId of selected) {
      try {
        await ctx.telegram.sendMessage(chatId, text);
      } catch (e) {
        console.error(e);
      }
    }

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await ctx.reply(`✅ Рассылка в ${selected.length} групп завершена!`);

    ctx.scene.state.groups.selected = [];
    ctx.scene.state.step = '';
    return await ctx.scene.reenter();
  }

  @Action('cancel')
  async cancel(@Ctx() ctx: IContext) {
    await ctx.answerCbQuery();
    return await ctx.scene.enter('scenes.admin');
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
      console.log(
        ctx.session.groupSet?.selectedChatIds,
        ctx.session.groupSet?.selectedChatIds?.length,
      );

      await ctx.answerCbQuery(
        '⚠️ Сначала выберите хотя бы одну группу!',
        // { show_alert: true },
      );
      return;
    }
    return await ctx.scene.enter('scenes.group_set_manager.create');
  }
}
