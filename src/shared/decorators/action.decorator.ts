import { Action } from 'nestjs-telegraf';

export function ActionContract(
  callback_data: string | string[],
): MethodDecorator {
  return Action(callback_data as string[]);
}
