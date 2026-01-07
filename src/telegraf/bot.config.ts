import { registerAs } from '@nestjs/config';

interface Config {
  token: string;
}
if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN not found');
}
export default registerAs(
  'bot',
  (): Config => ({
    token: process.env.TELEGRAM_BOT_TOKEN!,
  }),
);
