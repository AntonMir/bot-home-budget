import { Telegraf } from 'telegraf';
import { BotContext } from '../context';
import { BotUsers } from '../models/botUser';
import { Document } from 'mongodb';
import { sleep } from '../utils/sleep';

/**
 * Унифицированный агрегатор запроса
 * Поиск пользователей:
 * - для текущего бота
 * - доп. параметры объектом
 * @param {Telegraf<BotContext>} bot
 * @param {object} queryParams - доп. параметры запроса в mongo
 */
export async function findUsers(
    bot: Telegraf<BotContext>,
    queryParams?: object
): Promise<Document[]> {
    try {
        return await BotUsers.aggregate([
            {
                $match: {
                    bot: bot.context.botObject._id,
                    buyerRefer: { $exists: true },
                    ban: { $ne: true },
                    ...queryParams,
                },
            },
        ]).toArray();
    } catch (error) {
        console.error(`Cron > findUsersByParams > Error: `, error);
    }
}

/**
 * Унифицированный таймер
 * - если время не указано явно, возвращает интервал в 5 минут.
 */
export function timer(minutes?: number | string): string {
    try {
        if (minutes) {
            return `*/${minutes} * * * *`;
        }
        return `*/5 * * * *`;
    } catch (error) {
        console.error('Push Timer Error >>>', error);
    }
}

/**
 * Обновление дневного лимита
 */
export async function resetEveryDayLimit(
    bot: Telegraf<BotContext>,
    users: Document[]
) {
    await BotUsers.updateMany(
        {
            _id: { $in: users.map((user) => user._id) },
            bot: bot.context.botObject._id,
        },
        {
            $set: {
                'data.imageCounter': 0,
                'data.sponsorReward': false,
            },
        }
    );
}

/**
 * Удаление предыдущих сообщений чата
 */
export async function deleteChatMessages(
    bot_token: string,
    chat_id: number,
    lastMessage: number,
    numberOfMessagesToDelete: number = 5
) {
    const chatMessageList = new Array(numberOfMessagesToDelete);
    for await (let i of chatMessageList) {
        try {
            await sleep(200);
            await fetch(
                `https://api.telegram.org/bot${bot_token}/deleteMessage?chat_id=${chat_id}&message_id=${lastMessage++}`
            );
            await sleep(200);
        } catch (e) {}
    }
}
