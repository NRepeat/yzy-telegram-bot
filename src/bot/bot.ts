import { Telegraf, session, Scenes } from 'telegraf';
import { SceneManager } from './scene.manager';
import { GroupService } from './services/group.service';
import { AdminGuard } from './guards/admin.guard';
import { MyContext } from './types';

export class Bot {
  private readonly bot: Telegraf<any>;
  private readonly sceneManager: SceneManager;
  private readonly groupService: GroupService;
  private readonly adminGuard: AdminGuard;

  constructor(token: string) {
    this.bot = new Telegraf<any>(token);
    this.sceneManager = new SceneManager(this.bot);
    this.groupService = new GroupService();
    this.adminGuard = new AdminGuard();
    this.bot.use(this.adminGuard.middleware());
    this.bot.use(session());
    this.bot.use(this.sceneManager.getStage().middleware());
    this.sceneManager.registerScenes();
    this.registerCommands();
    this.registerListeners();
  }

  public getBot() {
    return this.bot;
  }

  public async startWebhook() {
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL + '/telegraf';
    if (!webhookUrl) {
      throw new Error('TELEGRAM_WEBHOOK_URL is not set');
    }
    const webhook = await this.bot.telegram.getWebhookInfo();
    if(webhook.url !== webhookUrl) {
      await this.bot.telegram.setWebhook(webhookUrl);
    }
    return webhookUrl;
  }

  private registerCommands() {
    this.bot.command('send', (ctx) => ctx.scene.enter('send'));
    this.bot.command('edit', (ctx) => {
      const args = ctx.message.text.split(' ');
      const broadcastId = parseInt(args[1]);
      if (isNaN(broadcastId)) {
        ctx.reply('Please provide a valid broadcast ID. Usage: /edit <broadcast_id>');
        return;
      }
      ctx.scene.session.broadcastId = broadcastId;
      ctx.scene.enter('edit');
    });
    this.bot.command('saveset', (ctx) => ctx.scene.enter('saveset'));
  }

  private registerListeners() {
    this.bot.on('my_chat_member', async (ctx) => {
      if (ctx.myChatMember.new_chat_member.status === 'member' || ctx.myChatMember.new_chat_member.status === 'administrator') {
        const chat = ctx.myChatMember.chat;
        if (chat.type === 'group' || chat.type === 'supergroup') {
          await this.groupService.createOrUpdateGroup(BigInt(chat.id), chat.title);
        }
      }
    });
  }
}
