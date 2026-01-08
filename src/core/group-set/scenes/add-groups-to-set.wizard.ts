import { Action, Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { ExtraService } from '../../extra/extra.service';
import { GroupSetService } from '../group-set.service';
import type { IContext, ISceneContextScene } from 'src/shared/interfaces';
import type {
  I18nPath,
  I18nTranslations,
} from 'src/shared/types/translate.types.generated';
import { Scenes as TelegrafScenes } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { PathImpl2 } from '@nestjs/config';

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
    const { lang } = ctx.session;
    // const groupSets = await this.groupSetService.getAllGroupSets();
    const { groupSet } = ctx.session;
    const selectedChatIds = groupSet?.selectedChatIds || [];
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
    const buttons: {
      text: PathImpl2<I18nTranslations>;
      callback_data: string;
    }[][] = [];
    for (let i = 0; i < selectableGroupIds.length; i += 2) {
      const row = selectableGroupIds.slice(i, i + 2).map((set) => ({
        text: set.name as I18nPath,
        callback_data: `select_group_set_${set.id}`,
      }));
      buttons.push(row);
    }

    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.group_set_manager.enter_name' as I18nPath,
      ...this.extra.typedInlineKeyboard(
        [
          ...buttons,
          [{ text: 'buttons.accept' as I18nPath, callback_data: 'accept' }],
          [{ text: 'buttons.cancel' as I18nPath, callback_data: 'cancel' }],
        ],
        lang,
      ),
    });
    await ctx.answerCbQuery();
    ctx.wizard.next();
  }

  @Action('accept')
  @WizardStep(2)
  async onMessageInput(@Ctx() ctx: WizardCtx) {
    const { groupSet } = ctx.session;
    const { setId } = ctx.state;
    const selectedChatIds = groupSet?.selectedChatIds || [];

    if (selectedChatIds) {
      for (const chatId of selectedChatIds) {
        await this.groupSetService.addGroupToSet(Number(setId), BigInt(chatId));
      }
    }

    try {
      await ctx.reply(`✅ Группы добавлены!`);
      await ctx.scene.enter('scenes.group_set_manager.manage_selected');
    } catch (error: any) {
      if (error.message?.includes('already in set')) {
        await ctx.reply('ℹ️ Эта группа уже в этом сете.');
      } else {
        console.error('Add group error:', error);
        await ctx.reply('❌ Ошибка при добавлении.');
      }
      await ctx.scene.enter('scenes.group_set_manager.manage_selected');
    }
  }

  @Action('cancel')
  async onCancel(@Ctx() ctx: WizardCtx) {
    await ctx.scene.enter('scenes.groups');
  }
}
