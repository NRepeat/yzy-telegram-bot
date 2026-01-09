import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { ExtraService } from '../../extra/extra.service';
import { GroupSetService } from '../group-set.service';
import type { IContext, ISceneContextScene } from 'src/shared/interfaces';
import type { I18nPath } from 'src/shared/types/translate.types.generated';
import { Scenes as TelegrafScenes } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { ButtonsStack } from 'src/shared/types';

type WizardCtx = IContext & {
  scene: ISceneContextScene<WizardCtx>;
  wizard: TelegrafScenes.WizardContextWizard<WizardCtx>;
};

@Wizard('scenes.group_set_manager.add_to_set')
export class AddGroupsToSetWizard {
  constructor(
    private readonly extra: ExtraService,
    private readonly groupSetService: GroupSetService,
    private readonly prisma: PrismaService,
  ) {}

  @WizardStep(1)
  async onEnter(@Ctx() ctx: WizardCtx) {
    const { groupSet } = ctx.session;
    const setId = groupSet?.selectedChatIds;
    console.log(setId, ctx.session);
    if (!setId) {
      await this.extra.replyOrEdit(ctx, ctx.session.lang, {
        text: 'phrases.group_set_manager.no_set_selected_error' as I18nPath,
      });
      await ctx.scene.enter('scenes.group_set_manager');
      return;
    }
    if (!ctx.scene.state.sets) {
      ctx.scene.state.sets = {
        selectedSets: [],
        activeSets: [],
      };
    }

    await this.render(ctx);
  }

  private getSelected(ctx: IContext): string[] {
    if (!ctx.scene.state.sets?.selectedSets) {
      ctx.scene.state.sets.selectedSets = [];
    }
    return ctx.scene.state.sets.selectedSets;
  }

  private async render(ctx: WizardCtx, forceNew: boolean = false) {
    const selectedChatIds = (ctx.session.groupSet?.selectedChatIds || []).map(
      String,
    );
    const selectedSets = ctx.scene.state.sets?.selectedSets || [];
    const groupSets = await this.prisma.groupSet.findMany({
      include: { items: true },
    });
    const selectableGroupIds = groupSets.filter((set) =>
      set.items.every((i) => {
        const idInBase = i.chat_id.toString();
        const isPresent = selectedChatIds.map(String).includes(idInBase);
        return !isPresent;
      }),
    );
    // 3. Формируем кнопки
    const groupButtons = selectableGroupIds.map((set) => {
      const sId = set.id.toString();

      const isSelected = set && selectedSets.includes(sId);

      const icon = isSelected ? '☑️' : '⬜️';

      return [
        {
          text: `${icon} ${set.name}`,
          callback_data: `toggle_group_set_${sId}`,
        },
      ];
    });

    const messageText = `<b>Меню рассылки</b>\n\nВыбрано групп: <b>${selectedChatIds.length}</b>\nВыберите группы из списка ниже:`;

    const replyMarkup = { inline_keyboard: groupButtons };

    if (ctx.updateType === 'callback_query' && !forceNew) {
      try {
        await ctx.editMessageText(messageText, {
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        });
      } catch (e) {
        // Игнорируем ошибку, если содержимое не изменилось
      }
    } else {
      const sentMsg = await ctx.reply(messageText, {
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      });
      ctx.scene.state.lastMenuId = sentMsg.message_id;
    }
  }

  @Action(/toggle_group_set_(\d+)/)
  async toggleGroup(@Ctx() ctx: WizardCtx) {
    const setId = Number((ctx.callbackQuery as any).data.split('_').pop());
    let selectedSets = ctx.scene.state.sets?.selectedSets || [];
    console.log('Текущий выбор (IDs):', selectedSets, setId);
    if (!selectedSets || selectedSets.length === 0) {
      selectedSets = [];
    }

    const groupSet = await this.prisma.groupSet.findUnique({
      where: { id: setId },
      include: { items: true },
    });
    console.log('Загруженный сет:', groupSet);
    if (!groupSet) return ctx.answerCbQuery('Сет не найден');

    const currentSelected = new Set(selectedSets.map(String));

    console.log('Текущий выбор (IDs):', currentSelected);
    const isSetSelected =
      selectedSets.length > 0 && selectedSets.includes(setId.toString());
    console.log('Выбран ли сет сейчас:', isSetSelected);
    // 4. Переключаем (Toggle)
    if (isSetSelected) {
      // Если уже выбран — удаляем все ID этого сета

      selectedSets = selectedSets.filter((id) => id !== groupSet.id.toString());
    } else {
      const uniqueSet = new Set([...selectedSets, groupSet.id.toString()]);
      selectedSets = Array.from(uniqueSet);
    }

    // 5. Записываем обратно в стейт сцены как массив строк
    if (ctx.scene.state.sets?.selectedSets) {
      ctx.scene.state.sets.selectedSets = Array.from(selectedSets);
    }
    // Для отладки
    console.log('Текущий выбор (IDs):', ctx.scene.state.sets.selectedSets);

    await ctx.answerCbQuery();
    await this.render(ctx);
  }

  @Action('already_in_set')
  async onAlreadyInSet(@Ctx() ctx: WizardCtx) {
    await ctx.answerCbQuery('This group is already in the set.');
  }

  @Action('save_groups_to_set')
  async onSave(@Ctx() ctx: WizardCtx) {
    const selected = this.getSelected(ctx);
    const { groupSet: sessionGroupSet } = ctx.session;
    const setId = sessionGroupSet?.selectedGroupSetId;
    if (!setId) {
      await ctx.answerCbQuery('Please select a group set.');
      return;
    }
    if (selected.length === 0) {
      await ctx.answerCbQuery('Please select at least one group.');
      return;
    }

    try {
      let addedCount = 0;
      for (const groupId of selected) {
        try {
          await this.groupSetService.addGroupToSet(setId, BigInt(groupId));
          addedCount++;
        } catch (error: any) {
          if (error.message?.includes('already in set')) {
          } else {
            throw error; // Rethrow other errors
          }
        }
      }

      await this.extra.replyOrEdit(ctx, ctx.session.lang, {
        text: 'phrases.group_set_manager.groups_added_successfully' as I18nPath,
        args: {
          count: addedCount,
        },
      });
    } catch (error) {
      console.error('Error adding groups to set:', error);
      await this.extra.replyOrEdit(ctx, ctx.session.lang, {
        text: 'phrases.group_set_manager.add_groups_error' as I18nPath,
      });
    } finally {
      await ctx.scene.enter('scenes.group_set_manager.manage_selected');
    }
  }

  @Action('cancel_add_group')
  async onCancel(@Ctx() ctx: WizardCtx) {
    await ctx.scene.enter('scenes.group_set_manager.manage_selected');
  }
}
