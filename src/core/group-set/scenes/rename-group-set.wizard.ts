import { Action, Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { ExtraService } from '../../extra/extra.service';
import { GroupSetService } from '../group-set.service';
import type { IContext, ISceneContextScene } from 'src/shared/interfaces';
import type { I18nPath } from 'src/shared/types/translate.types.generated';
import { Markup } from 'telegraf';
import { Scenes as TelegrafScenes } from 'telegraf';

// Local type for wizard context
type WizardCtx = IContext & {
  scene: ISceneContextScene<WizardCtx>;
  wizard: TelegrafScenes.WizardContextWizard<WizardCtx>;
};

@Wizard('scenes.group_set_manager.rename_set')
export class RenameGroupSetWizard {
  constructor(
    private readonly extra: ExtraService,
    private readonly groupSetService: GroupSetService,
  ) {}

  @WizardStep(1)
  async onEnter(@Ctx() ctx: WizardCtx) {
    const { lang, groupSet } = ctx.session;
    const setId = groupSet?.selectedGroupSetId;

    if (!setId) {
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.set_not_found' as I18nPath,
      });
      return ctx.scene.enter('scenes.group_set_manager');
    }

    const selectedGroupSet = await this.groupSetService.getGroupSetById(setId);

    if (!selectedGroupSet) {
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.set_not_found' as I18nPath,
      });
      return ctx.scene.enter('scenes.group_set_manager');
    }

    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.group_set_manager.rename_set_prompt' as I18nPath, // Needs localization
      args: { currentName: selectedGroupSet.name },
      ...Markup.inlineKeyboard([
        [Markup.button.callback('buttons.cancel' as I18nPath, 'cancel_rename_set')],
      ]),
    });
    ctx.wizard.next(); // Move to the next step to receive the new name
  }

  @On('text')
  @WizardStep(2)
  async onNameInput(@Ctx() ctx: WizardCtx) {
    const { lang, groupSet } = ctx.session;
    const setId = groupSet?.selectedGroupSetId;
    const newName = (ctx.message as any).text;

    if (!setId) {
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.set_not_found' as I18nPath,
      });
      return ctx.scene.enter('scenes.group_set_manager');
    }

    if (!newName || newName.trim().length === 0) {
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.rename_set_prompt' as I18nPath, // Re-prompt if name is empty
      });
      return; // Stay on the same step
    }

    try {
      // Check if a group set with this newName already exists (excluding the current set)
      const existingGroupSet = await this.groupSetService.getGroupSetByName(newName);
      if (existingGroupSet && existingGroupSet.id !== setId) {
        await this.extra.replyOrEdit(ctx, lang, {
          text: 'phrases.group_set_manager.set_name_exists' as I18nPath,
        });
        return; // Stay on the same step
      }

      const updatedSet = await this.groupSetService.updateGroupSetName(setId, newName);
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.set_renamed' as I18nPath, // Needs localization
        args: { oldName: ctx.wizard.state.oldName, newName: updatedSet.name },
      });
      await ctx.scene.enter('scenes.group_set_manager.manage_selected');
    } catch (error) {
      console.error('Error renaming group set:', error);
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.error' as I18nPath,
      });
      await ctx.scene.enter('scenes.group_set_manager.manage_selected');
    }
  }

  @Action('cancel_rename_set')
  async onCancel(@Ctx() ctx: WizardCtx) {
    const { lang } = ctx.session;
    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.cancelled' as I18nPath,
    });
    await ctx.scene.enter('scenes.group_set_manager.manage_selected');
  }
}
