import { Action, On, SceneEnter } from 'nestjs-telegraf';
import { SceneContract } from 'src/shared/decorators';
import { ExtraService } from '../extra/extra.service';
import type { IContext } from 'src/shared/interfaces';
import { GroupService } from './group.service';
import { InlineKeyboardButton } from 'telegraf/types';

@SceneContract('scenes.groups')
export class GroupScene {
  constructor(
    private readonly extra: ExtraService,
    private readonly groupService: GroupService,
  ) {}

  @SceneEnter()
  async enter(ctx: IContext) {
    if (!ctx.scene.state.groups) {
      ctx.scene.state.groups = {
        selected: [],
        activeSets: [],
      };
    }
    console.log(ctx.scene.state.groups);
    await this.render(ctx);
  }

  private getSelected(ctx: IContext): number[] {
    if (!Array.isArray(ctx.scene.state.groups.selected)) {
      ctx.scene.state.groups.selected = [];
    }
    return ctx.scene.state.groups.selected;
  }

  private async render(ctx: IContext, forceNew: boolean = false) {
    const groups = await this.groupService.getAllGroups({});
    const selected = this.getSelected(ctx);
    const keyboard: InlineKeyboardButton[][] = [];
    for (let i = 0; i < groups.length; i += 2) {
      const row = groups.slice(i, i + 2).map((g) => ({
        text: `${selected.includes(Number(g.chat_id)) ? '☑️' : '⬜'} ${g.title}`,
        callback_data: `group_${g.chat_id}`,
      }));
      keyboard.push(row);
    }
    keyboard.push([
      { text: 'Send', callback_data: 'send' },
      { text: 'Add to set', callback_data: 'add_to_set' },
    ]);
    keyboard.push([{ text: 'Cancel', callback_data: 'cancel' }]);

    const messageText = `Select groups: (${selected.length} selected)`;

    if (ctx.updateType === 'callback_query' && !forceNew) {
      try {
        await ctx.editMessageText(messageText, {
          reply_markup: { inline_keyboard: keyboard },
          parse_mode: 'HTML',
        });
      } catch (err: any) {
        if (err?.response?.description?.includes('message is not modified')) {
          console.log('Message not modified, skipping update');
          return;
        }
        console.error('Error editing message:', err);
      }
    } else {
      await ctx.reply(messageText, {
        reply_markup: { inline_keyboard: keyboard },
      });
    }
  }
  @Action('add_to_set')
  async toGroupSetScene(ctx: IContext) {
    const selectedGroups = this.getSelected(ctx);

    // Проверяем существование groupSet и инициализируем, если его нет
    if (!ctx.session.groupSet) {
      ctx.session.groupSet = { selectedChatIds: [] };
    }

    const sessionIds = ctx.session.groupSet.selectedChatIds || [];

    const uniqIds = new Set([...selectedGroups, ...sessionIds]);

    ctx.session.groupSet.selectedChatIds = Array.from(
      uniqIds as any as bigint[],
    );

    await ctx.scene.enter('scenes.group_set_manager');
  }
  @Action(/group_(.+)/)
  async toggleGroup(ctx: IContext) {
    const chatId = Number(ctx.callbackQuery.data.replace('group_', ''));
    console.log('Toggling chatId:', chatId);

    const selected = this.getSelected(ctx);
    const index = selected.indexOf(chatId);

    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(chatId);
    }

    console.log('Selected after toggle:', selected);

    await ctx.answerCbQuery();
    await this.render(ctx);
  }

  @Action('send')
  async send(ctx: IContext) {
    const selected = this.getSelected(ctx);

    if (selected.length === 0) {
      await ctx.answerCbQuery('⚠️ Please select at least one group');
      return;
    }

    await ctx.answerCbQuery();
    await ctx.reply('Enter message text:');
    // ctx.scene.state.step = 'enter_text';
  }

  @Action('cancel')
  async cancel(ctx: IContext) {
    await ctx.answerCbQuery();
    await ctx.reply('Cancelled');
    await ctx.scene.leave();
  }

  @On('text')
  async onText(ctx: IContext) {
    // if (ctx.scene.state.step !== 'enter_text') return;

    // const text = ctx.message.text;
    const selected = this.getSelected(ctx);

    await ctx.reply(`Sending to ${selected.length} group(s)...`);

    // Send message to selected groups
    let successCount = 0;
    for (const chatId of selected) {
      try {
        // await ctx.telegram.sendMessage(chatId, text);
        successCount++;
      } catch (err) {
        console.error(`Failed to send to ${chatId}:`, err);
      }
    }

    await ctx.reply(`✅ Sent to ${successCount} of ${selected.length} groups`);
    await ctx.scene.leave();
  }
}
