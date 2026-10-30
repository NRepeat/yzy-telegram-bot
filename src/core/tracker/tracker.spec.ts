import { parseUsernames, toTrackedMessage } from './tracker';

const users = parseUsernames('@Acc2_N, Acc3_R');
const chat = { id: -100, type: 'supergroup', title: 'Заявки' };

describe('toTrackedMessage', () => {
  it('сохраняет ответ отслеживаемого аккаунта со временем ответа', () => {
    const row = toTrackedMessage(
      {
        message_id: 2,
        date: 1000,
        chat,
        from: { id: 6455899560, username: 'acc2_n' },
        text: 'беру',
        reply_to_message: {
          message_id: 1,
          date: 993,
          chat,
          from: { id: 1, username: 'yzy_ex_bot' },
          text: 'заявка 500 USD',
        },
      } as any,
      users,
    );
    expect(row).toMatchObject({
      username: 'acc2_n',
      chat_title: 'Заявки',
      text: 'беру',
      reply_to_message_id: 1,
      reply_to_username: 'yzy_ex_bot',
      reply_to_text: 'заявка 500 USD',
      response_seconds: 7,
    });
  });

  it('пропускает чужие сообщения', () => {
    const msg = {
      message_id: 3,
      date: 1,
      chat,
      from: { id: 5, username: 'other' },
    };
    expect(toTrackedMessage(msg as any, users)).toBeNull();
  });
});
