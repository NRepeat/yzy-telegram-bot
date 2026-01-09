import { Action, Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { ExtraService } from '../../extra/extra.service';
import { GroupSetService } from '../group-set.service';
import type { I18nPath } from 'src/shared/types/translate.types.generated';
import type { WizardCtx } from 'src/shared/interfaces/wizard';

@Wizard('scenes.group_set_manager.create')
export class CreateGroupSetWizard {
  constructor(
    private readonly extra: ExtraService,
    private readonly groupSetService: GroupSetService,
  ) {}

  @WizardStep(1)
  async onEnter(@Ctx() ctx: WizardCtx) {
    const { lang } = ctx.session;
    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.group_set_manager.enter_name' as I18nPath,
      ...this.extra.typedInlineKeyboard(
        [[{ text: 'buttons.cancel' as I18nPath, callback_data: 'cancel' }]],
        lang,
      ),
    });
    await ctx.answerCbQuery();
    ctx.wizard.next();
  }

  @On('message')
  @WizardStep(2)
  async onNameInput(@Ctx() ctx: WizardCtx) {
    const { lang } = ctx.session;

    const name = (ctx.message as any).text as string;

    if (!name || name.trim().length === 0) {
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.enter_name' as I18nPath,
      });
      return;
    }

    try {
      const existingGroupSet =
        await this.groupSetService.getGroupSetByName(name);
      if (existingGroupSet) {
        await this.extra.replyOrEdit(ctx, lang, {
          text: 'phrases.group_set_manager.set_name_exists' as I18nPath,
        });
        return;
      }
      const newGroupSet = await this.groupSetService.createGroupSet(name);
      const groupSets = ctx.session.groupSet?.selectedChatIds || [];

      if (newGroupSet && groupSets) {
        for (const id of groupSets) {
          await this.groupSetService.addGroupToSet(newGroupSet.id, BigInt(id));
        }
      }
      if (ctx.session.groupSet?.selectedChatIds) {
        ctx.session.groupSet.selectedChatIds = [];
      }
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.set_created' as I18nPath,
        args: { name: newGroupSet.name },
      });
      await ctx.scene.enter('scenes.group_set_manager'); // Go back to the main group set manager scene
    } catch (error) {
      console.error('Error creating group set:', error);
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.error' as I18nPath, // Generic error phrase
      });
      await ctx.scene.enter('scenes.group_set_manager.list'); // Go back on error
    }
  }

  @Action('cancel')
  async onCancel(@Ctx() ctx: WizardCtx) {
    const { lang } = ctx.session;
    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.cancelled' as I18nPath,
    });
    await ctx.scene.enter('scenes.group_set_manager'); // Go back to the main group set manager scene
  }
}
