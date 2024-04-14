import { BotContext } from '../interface/bot-context.interface';

const getSessionKey = ({ from }, botObject: any) => {
    const bot = botObject._id;
    if (from == null) {
        return null;
    }

    return { id: from.id, bot };
};

export const BotUsers = mongoose.connection.collection('botUsers');

/**
 * Session middleware with native meteor mongodb connection
 */
export const sessionService = (botObject: any) => {
    const collection = BotUsers;

    const saveSession = async (
        key: { id: number; bot: string },
        data: any
    ): Promise<void> => {
        await collection.updateOne(key, { $set: { data } }, { upsert: true });
    };

    const getSession = async (key: {
        id: number;
        bot: string;
    }): Promise<any> => {
        return (await collection.findOne(key))?.data ?? {};
    };

    return async (ctx: BotContext, next: any) => {
        const key = getSessionKey(ctx, botObject);
        const data = key == null ? undefined : await getSession(key);

        ctx.session = data;
        // ctx.session.lastActivity = new Date();

        await next();

        if (ctx.session != null) {
            await saveSession(key, ctx.session);
        }
    };
};
