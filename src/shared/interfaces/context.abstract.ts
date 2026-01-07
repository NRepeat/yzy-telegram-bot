import { Context as BaseContext, Scenes as TelegrafScenes } from 'telegraf';

import { ICreateEntity } from './create.interface';
import { CallbackQuery, Message, Update } from 'telegraf/types';
import { SceneContextScene } from 'telegraf/scenes';
import { Langs } from '../types';

export interface IContext extends BaseContext {
  update: Update.CallbackQueryUpdate & { message: Message.PhotoMessage };
  scene: ISceneContextScene;
  session: SessionData;
  message: Update.New & Update.NonChannel & Message & { text?: string };
  callbackQuery: CallbackQuery & { data: string };
}

interface ISceneContextScene extends SceneContextScene<IContext, SceneSession> {
  enter: (id: string) => Promise<unknown>;
}

interface SessionData extends TelegrafScenes.SceneSession<SceneSession> {
  /** Переиспользуемо, служит для хранения временного имя, описания и картинки */
  creation?: ICreateEntity;
  image: string;
  messageId?: number;
  lang: Langs;
  isAdmin: boolean;
  groupSet?: {
    selectedGroupSetId?: number;
    selectedChatIds: bigint[];
  };
}

interface SceneSession extends TelegrafScenes.SceneSessionData {
  state: {
    token?: string;
  };
}
