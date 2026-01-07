import { IButton } from '../interfaces';
import { I18nPath } from './translate.types.generated';

export type ButtonsStack =
  | IButton[]
  | IButton[][]
  | I18nPath[]
  | I18nPath[][]
  | (IButton[] | I18nPath[])[];
