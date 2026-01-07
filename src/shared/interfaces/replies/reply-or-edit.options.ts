import { InlineKeyboardMarkup } from 'telegraf/types';
import { I18nPath } from '../../types';

export interface IReplyOrEditOptions {
  text: I18nPath;
  args?: any;
  reply_markup: InlineKeyboardMarkup;
}
