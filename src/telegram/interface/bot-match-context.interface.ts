import { BotContext } from './bot-context.interface';

export interface BotMatchContext extends BotContext {
  match: RegExpMatchArray;
}
