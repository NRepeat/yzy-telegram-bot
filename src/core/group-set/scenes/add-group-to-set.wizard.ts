import { Action, Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { ExtraService } from '../../extra/extra.service';
import { GroupSetService } from '../group-set.service';
import type { IContext, ISceneContextScene } from 'src/shared/interfaces';
import type { I18nPath } from 'src/shared/types/translate.types.generated';
import { Scenes as TelegrafScenes } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

// Local type for wizard context, similar to create-group-set.wizard.ts
type WizardCtx = IContext & {
  scene: ISceneContextScene<WizardCtx>;
  wizard: TelegrafScenes.WizardContextWizard<WizardCtx>;
};

@Wizard('scenes.group_set_manager.add_group')
export class AddGroupToSetWizard {
  constructor(
    private readonly extra: ExtraService,
    private readonly groupSetService: GroupSetService,
    private readonly prisma: PrismaService, // Inject PrismaService to handle Group model
  ) {}

  @WizardStep(1)
  async onEnter(@Ctx() ctx: WizardCtx) {
    const { lang } = ctx.session;
    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.group_set_manager.add_group_prompt' as I18nPath, // Needs localization
      ...this.extra.typedInlineKeyboard(
        [
          [
            {
              text: 'buttons.cancel' as I18nPath,
              callback_data: 'cancel_add_group',
            },
          ],
        ],
        lang,
      ),
    });
    ctx.wizard.next(); // Move to the next step to receive the forwarded message
  }

  @On('message') // Intercept any message (expecting a forwarded message)
  @WizardStep(2)
  async onMessageInput(@Ctx() ctx: WizardCtx) {
    const { lang, groupSet } = ctx.session;
    const setId = groupSet?.selectedGroupSetId;

    if (!setId) {
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.set_not_found' as I18nPath,
      });
      return ctx.scene.enter('scenes.group_set_manager');
    }

    const message = ctx.message;
    let chatId: bigint | undefined;
    let chatTitle: string | undefined;

    // Check for forwarded message from a channel or group
    if ((message as any).forward_from_chat) {
      chatId = BigInt((message as any).forward_from_chat.id);
      chatTitle = (message as any).forward_from_chat.title;
    } else if (
      (message as any).chat?.type === 'group' ||
      (message as any).chat?.type === 'supergroup'
    ) {
      // If the message is directly from a group where the bot is installed
      chatId = BigInt((message as any).chat.id);
      chatTitle = (message as any).chat.title;
    }

    if (!chatId || !chatTitle) {
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.invalid_group_message' as I18nPath, // Needs localization
      });
      return; // Stay on the same step
    }

    try {
      // Ensure the group exists in the main Group table
      let groupRecord = await this.prisma.group.findUnique({
        where: { chat_id: chatId },
      });
      if (!groupRecord) {
        groupRecord = await this.prisma.group.create({
          data: { chat_id: chatId, title: chatTitle },
        });
      }

      // Add the group to the selected GroupSet
      await this.groupSetService.addGroupToSet(setId, chatId);

      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.group_added' as I18nPath,
        args: { chat_id: chatId.toString(), name: chatTitle },
      });
      await ctx.scene.enter('scenes.group_set_manager.manage_selected');
    } catch (error: any) {
      if (error.message.includes('already in set')) {
        await this.extra.replyOrEdit(ctx, lang, {
          text: 'phrases.group_set_manager.group_already_in_set' as I18nPath, // Needs localization
          args: { chat_id: chatId.toString(), name: chatTitle },
        });
      } else {
        console.error('Error adding group to set:', error);
        await this.extra.replyOrEdit(ctx, lang, {
          text: 'phrases.error' as I18nPath,
        });
      }
      await ctx.scene.enter('scenes.group_set_manager.manage_selected');
    }
  }

  @Action('cancel_add_group')
  async onCancel(@Ctx() ctx: WizardCtx) {
    const { lang } = ctx.session;
    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.cancelled' as I18nPath,
    });
    await ctx.scene.enter('scenes.group_set_manager.manage_selected');
  }
}
