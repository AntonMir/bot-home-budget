import { Composer } from 'telegraf';
import { BotContext } from '../interface/bot-context.interface';

const pushActions = new Composer<BotContext>();

export default pushActions;
