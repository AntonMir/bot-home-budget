import { BotContext } from '../interface/bot-context.interface';
import { Message } from 'telegraf/types';
import { Logger, setLogger } from '../../utils/logger';

export default class MessageCleanerService {
    private readonly logger: Logger

    constructor() {
        this.logger = setLogger({ name: MessageCleanerService.name })
    }

    public async deleteMessage(ctx: BotContext, message?: Message.TextMessage) {
        try {
            if(message) {
                await ctx.deleteMessage(message.message_id)
            } else {
                await ctx.deleteMessage()
            }
        } catch (error) {
            this.logger.error(`deleteMessage > messageId: ${message.message_id} > ${error}`)
        }
    }

    public async messageClean(ctx: BotContext | Partial<BotContext>) {
        try {
            if (ctx.session.messageIds) {
                ctx.session.messageIds.map(async (message: number) => {
                    try {
                        await ctx.deleteMessage(message);
                    } catch (error) {
                        console.error(`MessageCleaner > message: ${message} > Error: ${error}`);
                    }
                });
            }
            ctx.session.messageIds = [];

        } catch(error) {
            this.logger.error(`messageClean > ${error}`)
        }
    };
}
