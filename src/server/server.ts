import fastify, { FastifyInstance } from 'fastify';
import { Bot } from '../bot/bot';
import { MyContext } from '../bot/types';

export class App {
  private readonly server: FastifyInstance;
  private readonly bot: Bot;

  constructor() {
    this.server = fastify();
    this.bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);
    this.server.post(`/telegraf`, this.bot.getBot().webhookCallback('/telegraf') as any);
  }

  public async listen() {
    try {
      const url = await this.bot.startWebhook();
      console.log(`Bot started with webhook at ${url}`);
      await this.server.listen({ port: 3000, host: '0.0.0.0' });
      console.log(`Server listening on port 3000`);
    } catch (err) {
      this.server.log.error(err);
      process.exit(1);
    }
  }
}
