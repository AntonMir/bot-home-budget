import { BotContext } from '../interface/bot-context.interface';

export const messageClean = async (
    ctx: BotContext | Partial<BotContext>
) => {
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

    } catch(e) {
        console.error('messageClean Error> ', e)
    }

};
