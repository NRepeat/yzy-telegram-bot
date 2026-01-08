import { Action, Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { ExtraService } from '../../extra/extra.service';
import { GroupSetService } from '../group-set.service';
import type { IContext, ISceneContextScene } from 'src/shared/interfaces';
import type { I18nPath } from 'src/shared/types/translate.types.generated';
import { Scenes as TelegrafScenes } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

type WizardCtx = IContext & {
  scene: ISceneContextScene<WizardCtx>;
  wizard: TelegrafScenes.WizardContextWizard<WizardCtx>;
};

@Wizard('scenes.group_set_manager.add_group')
export class AddGroupToSetWizard {
  constructor(
    private readonly extra: ExtraService,
    private readonly groupSetService: GroupSetService,
    private readonly prisma: PrismaService,
  ) {}

  @WizardStep(1)
  async onEnter(@Ctx() ctx: WizardCtx) {
    const { lang } = ctx.session;
    await this.extra.replyOrEdit(ctx, lang, {
      text: 'phrases.group_set_manager.add_group_prompt' as I18nPath,
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
    ctx.wizard.next();
  }

  @On('message')
  @WizardStep(2)
  async onMessageInput(@Ctx() ctx: WizardCtx) {
    const { groupSet } = ctx.session;
    const setId = groupSet?.selectedGroupSetId;
    const message = ctx.message as any;

    if (!setId) {
      await ctx.reply('Ошибка: Сет не выбран.');
      return ctx.scene.enter('scenes.group_set_manager');
    }

    let chatId: bigint | undefined;
    let chatTitle: string | undefined;

    const text = message?.text?.trim();

    const parseMatch = text?.match(/^(-?\d+)\s+(.+)$/);

    if (parseMatch) {
      chatId = BigInt(parseMatch[1]);
      chatTitle = parseMatch[2].trim();
    } else if (text && /^-?\d+$/.test(text)) {
      chatId = BigInt(text);
      chatTitle = `Группа ${text}`;
    }
    // 3. ПРОВЕРКА: Пересылки (стандартные механизмы)
    else if (message.forward_from_chat) {
      chatId = BigInt(message.forward_from_chat.id);
      chatTitle = message.forward_from_chat.title;
    } else if (message.forward_origin?.chat) {
      chatId = BigInt(message.forward_origin.chat.id);
      chatTitle = message.forward_origin.chat.title;
    } else if (message.sender_chat) {
      chatId = BigInt(message.sender_chat.id);
      chatTitle = message.sender_chat.title;
    }

    if (!chatId) {
      await ctx.reply(
        '⚠️ Не удалось распознать формат.\n\n' +
          'Введите данные в формате:\n`-100123456789 Моя Группа`\n' +
          'Или просто ID, либо перешлите сообщение.',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    try {
      await this.prisma.group.upsert({
        where: { chat_id: chatId },
        update: { title: chatTitle || `ID: ${chatId}` },
        create: { chat_id: chatId, title: chatTitle || `ID: ${chatId}` },
      });

      await this.groupSetService.addGroupToSet(setId, chatId);

      await ctx.reply(`✅ Группа "${chatTitle}" (ID: ${chatId}) добавлена!`);
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

  @Action('cancel_add_group')
  async onCancel(@Ctx() ctx: WizardCtx) {
    await ctx.scene.enter('scenes.group_set_manager.manage_selected');
  }
}
