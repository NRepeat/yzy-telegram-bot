import { Injectable } from '@nestjs/common';
import { IContext } from 'src/shared/interfaces';
import { Message } from 'telegraf/types';

@Injectable()
export class SessionService {
  /**
   * * Опасно, если играться то можно убить сессии всех юзеров
   * * Сообщение умникам, которые пишут: сделай просто `ctx.session = undefined`
   * * ! Идите в пизду
   * */
  resetBotSession(ctx: IContext): void {
    console.log(ctx);
    this.resetImage(ctx).resetPropsOnCreate(ctx);
  }

  /**
   * * Устанавливаем последнее сообщение в сцену, чтобы в любой следующей сцене удалить его
   * * В основном это делается, когда мы не можем изменить сообщение с фотографией (можем лишь удалить и отправить новое)
   * */
  setLastMessageId({ session }: IContext, msg: Message) {
    session.messageId = msg.message_id;
    return this;
  }

  setImage({ session }: IContext, url: URL) {
    session.image = url.toString();
    return this;
  }

  resetImage({ session }: IContext): this {
    session.image = '';
    return this;
  }

  resetPropsOnCreate({ session }: IContext): this {
    session.creation = {};
    return this;
  }
}
