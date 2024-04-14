import { Context, Telegraf } from 'telegraf';
import { BotContext } from '../context';
import { Update } from 'telegraf/types';

let messageId = Math.floor(Math.random() * 100);
let updateId = Math.floor(Math.random() * 100);

export const fakeHandleUpdater = async (
    bot: Telegraf<BotContext> | Telegraf<Context<Update>>,
    user: any,
    action: string
) => {
    const chatId = +user.id;
    const userId = +user.id;

    try {
        await bot.handleUpdate({
            update_id: updateId++,
            message: {
                message_id: messageId++,
                chat: {
                    id: chatId,
                    type: 'private',
                    first_name: user?.data?.first_name || user?.username,
                    username: user?.data?.username || user?.username,
                },
                from: {
                    id: userId,
                    is_bot: bot.botInfo?.is_bot,
                    first_name: user?.data?.first_name || user?.username,
                    username: user?.data?.username || user?.username,
                    language_code: 'ru',
                },
                text: `/${action}`,
                date: Date.now() / 1000,
                entities: [
                    {
                        type: 'bot_command',
                        offset: 0,
                        length: action.length + 1,
                    },
                ],
            },
        });
    } catch (e) {
        console.log(`handleUpdate Error>>>`, e);
    }
};
