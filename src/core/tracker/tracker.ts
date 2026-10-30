import type { Context, MiddlewareFn } from 'telegraf';
import type { Message } from 'telegraf/types';
import type { TrackedMessageCreateInput } from 'generated/prisma/models/TrackedMessage';
import { PrismaService } from 'src/prisma/prisma.service';

type AnyMessage = Message & {
  text?: string;
  caption?: string;
  reply_to_message?: AnyMessage;
};

const textOf = (msg: AnyMessage) => msg.text ?? msg.caption ?? null;

export const parseUsernames = (raw?: string) =>
  new Set(
    (raw || 'Acc2_N,Acc3_R,Acc5_C')
      .split(',')
      .map((u) => u.trim().replace(/^@/, '').toLowerCase())
      .filter(Boolean),
  );

/**
 * Любое сообщение в группе или сообщение отслеживаемого аккаунта в любом чате
 * → строка TrackedMessage, иначе null. Сообщения всей группы нужны, чтобы
 * считать время ответа и без reply: от последней заявки до ответа аккаунта.
 */
export function toTrackedMessage(
  msg: AnyMessage | undefined,
  usernames: Set<string>,
): TrackedMessageCreateInput | null {
  if (!msg?.from) {
    return null;
  }
  const username = msg.from.username ?? '';
  const inGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
  if (!inGroup && !usernames.has(username.toLowerCase())) {
    return null;
  }
  const reply = msg.reply_to_message;
  return {
    username,
    user_id: BigInt(msg.from.id),
    chat_id: BigInt(msg.chat.id),
    chat_title: 'title' in msg.chat ? msg.chat.title : null,
    message_id: msg.message_id,
    text: textOf(msg),
    sent_at: new Date(msg.date * 1000),
    reply_to_message_id: reply?.message_id ?? null,
    reply_to_username: reply?.from?.username ?? null,
    reply_to_text: reply ? textOf(reply) : null,
    reply_to_sent_at: reply ? new Date(reply.date * 1000) : null,
    response_seconds: reply ? msg.date - reply.date : null,
  };
}

/** Пишет сообщения в TrackedMessage и всегда пропускает апдейт дальше. */
export function trackerMiddleware(
  prisma: PrismaService,
  usernames: Set<string>,
): MiddlewareFn<Context> {
  return async (ctx, next) => {
    const row = toTrackedMessage(ctx.message as AnyMessage, usernames);
    if (row) {
      await prisma.trackedMessage
        .upsert({
          where: {
            chat_id_message_id: {
              chat_id: row.chat_id as bigint,
              message_id: row.message_id,
            },
          },
          update: {},
          create: row,
        })
        .catch((e) => console.error('Ошибка записи TrackedMessage:', e));
    }
    return next();
  };
}
