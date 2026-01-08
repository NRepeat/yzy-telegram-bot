import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { ExtraService } from '../../extra/extra.service';
import { GroupSetService } from '../group-set.service';
import type { IContext, ISceneContextScene } from 'src/shared/interfaces';
import type { I18nPath } from 'src/shared/types/translate.types.generated';
import { Scenes as TelegrafScenes } from 'telegraf';

// Local type for wizard context
type WizardCtx = IContext & {
  scene: ISceneContextScene<WizardCtx>;
  wizard: TelegrafScenes.WizardContextWizard<WizardCtx>;
};

@Wizard('scenes.group_set_manager.delete_set')
export class DeleteGroupSetWizard {
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
      text: 'phrases.group_set_manager.delete_set_confirm' as I18nPath, // Needs localization
      args: { setName: selectedGroupSet.name },
      ...this.extra.typedInlineKeyboard(
        [
          [
            {
              text: 'buttons.accept' as I18nPath,
              callback_data: 'confirm_delete_set',
            },
            {
              text: 'buttons.cancel' as I18nPath,
              callback_data: 'cancel_delete_set',
            },
          ],
        ],
        lang,
      ),
    });
  }

  @Action('confirm_delete_set')
  async onConfirmDelete(@Ctx() ctx: WizardCtx) {
    const { lang, groupSet } = ctx.session;
    const setId = groupSet?.selectedGroupSetId;

    if (!setId) {
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.set_not_found' as I18nPath,
      });
      return ctx.scene.enter('scenes.group_set_manager');
    }

    try {
      const deletedSet = await this.groupSetService.deleteGroupSet(setId);
      delete ctx.session.groupSet?.selectedGroupSetId; // Clear selected ID

      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.group_set_manager.set_deleted' as I18nPath,
        args: { name: deletedSet.name },
      });
      await ctx.scene.enter('scenes.group_set_manager');
    } catch (error) {
      console.error('Error deleting group set:', error);
      await this.extra.replyOrEdit(ctx, lang, {
        text: 'phrases.error' as I18nPath,
      });
      await ctx.scene.enter('scenes.group_set_manager.manage_selected'); // Go back to manage scene on error
    }
  }

  @Action('cancel_delete_set')
  async onCancelDelete(@Ctx() ctx: WizardCtx) {
    const { lang } = ctx.session;
    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.cancelled' as I18nPath,
    });
    await ctx.scene.enter('scenes.group_set_manager.manage_selected'); // Go back to manage scene
  }
}
