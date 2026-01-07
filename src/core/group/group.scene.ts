import { Action, On, SceneEnter } from 'nestjs-telegraf';
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
    // Always work with arrays since Sets don't serialize properly
    if (!Array.isArray(ctx.scene.state.groups.selected)) {
      ctx.scene.state.groups.selected = [];
    }
    return ctx.scene.state.groups.selected;
  }

  private async render(ctx: IContext, forceNew: boolean = false) {
    const groups = await this.groupService.getAllGroups({});
    const selected = this.getSelected(ctx);

    // Generate keyboard with current selected state
    const keyboard = groups.map((g) => [
      {
        text: `${selected.includes(Number(g.chat_id)) ? '☑️' : '⬜'} ${g.title}`,
        callback_data: `group_${g.chat_id}`,
      },
    ]);
    keyboard.push([{ text: 'Send', callback_data: 'send' }]);
    keyboard.push([{ text: 'Cancel', callback_data: 'cancel' }]);

    const messageText = `Select groups: (${selected.length} selected)`;

    // Edit or send message based on update type
    if (ctx.updateType === 'callback_query' && !forceNew) {
      try {
        await ctx.editMessageText(messageText, {
          reply_markup: { inline_keyboard: keyboard },
        });
      } catch (err: any) {
        // Ignore error if message content hasn't changed
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

  @On('callback_query')
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
