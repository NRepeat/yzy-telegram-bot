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
    const { lang, groupSet } = ctx.session;
    const setId = groupSet?.selectedGroupSetId;
    const message = ctx.message as any;

    if (!setId) {
      await ctx.reply('Ошибка: Сет не выбран.');
      return ctx.scene.enter('scenes.group_set_manager');
    }

    let chatId: bigint | undefined;
    let chatTitle: string | undefined;

    // 1. ПРОВЕРКА: Ввел ли пользователь ID вручную текстом
    const text = message?.text?.trim();
    if (text && /^-?\d+$/.test(text)) {
      chatId = BigInt(text);
      chatTitle = `Группа ${text}`;
    }
    // 2. ПРОВЕРКА: Пересылка (старый формат)
    else if (message.forward_from_chat) {
      chatId = BigInt(message.forward_from_chat.id);
      chatTitle = message.forward_from_chat.title;
    }
    // 3. ПРОВЕРКА: Пересылка (новый формат forward_origin)
    else if (message.forward_origin?.chat) {
      chatId = BigInt(message.forward_origin.chat.id);
      chatTitle = message.forward_origin.chat.title;
    }
    // 4. ПРОВЕРКА: Если сообщение от имени канала
    else if (message.sender_chat) {
      chatId = BigInt(message.sender_chat.id);
      chatTitle = message.sender_chat.title;
    }

    // Если ничего не нашли
    if (!chatId) {
      await ctx.reply(
        '⚠️ Не удалось распознать ID группы. Пожалуйста, введите ID вручную (например: -100123456789) или перешлите сообщение из публичной группы.',
      );
      return; // Остаемся на этом шаге
    }

    try {
      // Upsert группы в базу
      await this.prisma.group.upsert({
        where: { chat_id: chatId },
        update: { title: chatTitle || `ID: ${chatId}` },
        create: { chat_id: chatId, title: chatTitle || `ID: ${chatId}` },
      });

      // Привязка к сету
      await this.groupSetService.addGroupToSet(setId, chatId);

      await ctx.reply(`✅ Группа "${chatTitle || chatId}" успешно добавлена!`);
      await ctx.scene.enter('scenes.group_set_manager.manage_selected');
    } catch (error: any) {
      if (error.message?.includes('already in set')) {
        await ctx.reply('ℹ️ Эта группа уже добавлена в данный сет.');
      } else {
        console.error('Add group error:', error);
        await ctx.reply('❌ Произошла ошибка при добавлении группы.');
      }
      await ctx.scene.enter('scenes.group_set_manager.manage_selected');
    }
  }

  @Action('cancel_add_group')
  async onCancel(@Ctx() ctx: WizardCtx) {
    await ctx.scene.enter('scenes.group_set_manager.manage_selected');
  }
}
