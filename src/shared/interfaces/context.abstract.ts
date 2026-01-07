import { Context as BaseContext, Scenes as TelegrafScenes } from 'telegraf';

import { ICreateEntity } from './create.interface';
import { CallbackQuery, Message, Update } from 'telegraf/types';
import { SceneContextScene } from 'telegraf/scenes';
import { Langs } from '../types';

export interface ISceneContextScene<TContext extends BaseContext = IContext> extends SceneContextScene<TContext, SceneSession> {
  enter: (id: string) => Promise<unknown>;
}

export interface IContext extends BaseContext {
  update: Update.CallbackQueryUpdate & { message: Message.PhotoMessage };
  scene: ISceneContextScene<IContext>;
  session: SessionData; // Re-added session property
  message: Update.New & Update.NonChannel & Message & { text?: string };
  callbackQuery: CallbackQuery & { data: string };
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
  cursor: number; // Changed to required
}
