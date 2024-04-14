import {
    ForceReply,
    InlineKeyboardMarkup,
    MessageEntity,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
} from 'telegraf/types';
import { session } from './session';
import ApiClient from 'telegraf/typings/core/network/client';
import { FmtString } from 'telegraf/typings/format';
import { Telegram } from 'telegraf';
import { BotContext } from '../interface/bot-context.interface';

type Tail<T> = T extends [unknown, ...infer U] ? U : never;
type Shorthand<FName extends Exclude<keyof Telegram, keyof ApiClient>> = Tail<
    Parameters<Telegram[FName]>
>;

export async function sendPhoto(
    ctx: BotContext,
    loc,
    extra?: {
        message_thread_id?: number;
        caption_entities?: MessageEntity[];
        reply_markup?:
            | InlineKeyboardMarkup
            | ReplyKeyboardMarkup
            | ReplyKeyboardRemove
            | ForceReply;

        caption?: string | FmtString;
        parse_mode?: 'HTML' | 'Markdown';
    }
): Promise<void> {
    try {
        const fileId = await ctx.fileId.getFileId(loc);
        const welcomeRes = await ctx.replyWithPhoto(fileId, extra as any);
        await ctx.fileId.callbackFunction(welcomeRes, loc, 'photo');
        session(ctx.botObject);
    } catch (error) {
        console.error(error);
    }
}

export async function sendSticker(
    ctx: BotContext,
    loc: string,
    text?: string | FmtString,
    extra?: {
        message_thread_id?: number;
        caption_entities?: MessageEntity[];
        reply_markup?:
            | InlineKeyboardMarkup
            | ReplyKeyboardMarkup
            | ReplyKeyboardRemove
            | ForceReply;
        parse_mode?: 'HTML' | 'Markdown';
    }
): Promise<void> {
    try {
        const fileId = await ctx.fileId.getFileId(loc);
        const welcomeRes = await ctx.replyWithSticker({
            ...fileId,
            width: 64,
            height: 1000,
        });
        await addIdsToDel(ctx, welcomeRes.message_id);

        if (text) {
            const welcomeMessage = await ctx.sendMessage(text, extra);
            await addIdsToDel(ctx, welcomeMessage.message_id);
        }

        await ctx.fileId.callbackFunction(welcomeRes, loc, 'sticker');
        session(ctx.botObject);
    } catch (error) {
        console.error(error);
    }
}

// export async function getUnwatchedVideo(
//     ctx: BotContext
// ): Promise<string | null> {
//     try {
//         const videos: string[] = ctx.loc._('VIDEOS') || [];
//         if (!videos || videos.length == 0) return null;
//         const used = ctx.session.watchedVideo || [];
//         const unused = videos.filter((video) => !used.includes(video));
//         if (unused.length == 0) {
//             ctx.session.watchedVideo = [];
//             ctx.session.watchedVideo.push(videos[0]);
//             return videos[0];
//         }
//         const video = unused[Math.floor(Math.random() * unused.length)];

//         ctx.session.watchedVideo.push(video);

//         return video;
//     } catch (error) {
//         console.log(error);
//     }
// }

// export async function ClearMsgToDelDB(ctx: BotContext) {
//     ctx.session.msgToDelete = [];
//     flushSession(ctx, { id: ctx.from.id, bot: ctx.botObject._id }, ctx.session);
//     // await BotUsers.updateOne(
//     //     { id: ctx.from.id, bot: ctx.botObject._id },
//     //     {
//     //         $set: {
//     //             'data.msgToDelete': [],
//     //         },
//     //     }
//     // );
// }
export async function sendVideo(
    ctx: BotContext,
    loc,
    extra?: {
        message_thread_id?: number;
        caption_entities?: MessageEntity[];
        reply_markup?:
            | InlineKeyboardMarkup
            | ReplyKeyboardMarkup
            | ReplyKeyboardRemove
            | ForceReply;

        caption?: string | FmtString;
        parse_mode?: 'HTML' | 'Markdown';
    }
) {
    // console.log('sendPhoto:', loc);
    const fileId = await ctx.fileId.getFileId(loc);
    //   console.log('fileId:', fileId);

    const welcomeRes = await ctx.replyWithVideo(fileId, extra as any);
    //  console.log('welcomeRes:', welcomeRes);
    await ctx.fileId.callbackFunction(welcomeRes, loc, 'video');
    // ctx.session.msgToDelete.push(welcomeRes.message_id);

    await addIdsToDel(ctx, welcomeRes.message_id);
    return welcomeRes;
}

export async function sendDocument(
    ctx: BotContext,
    loc,
    extra?: {
        message_thread_id?: number;
        caption_entities?: MessageEntity[];
        reply_markup?:
            | InlineKeyboardMarkup
            | ReplyKeyboardMarkup
            | ReplyKeyboardRemove
            | ForceReply;

        caption?: string | FmtString;
        parse_mode?: 'HTML' | 'Markdown';
    }
) {
    const fileId = await ctx.fileId.getFileId(loc);
    const welcomeRes = await ctx.replyWithDocument(fileId, extra as any);
    await ctx.fileId.callbackFunction(welcomeRes, loc, 'document');
    await addIdsToDel(ctx, welcomeRes.message_id);
    return welcomeRes;
}

export async function replyWrapper(
    ctx: BotContext,
    text: string,
    extra?: {
        message_thread_id?: number;
        reply_markup?:
            | InlineKeyboardMarkup
            | ReplyKeyboardMarkup
            | ReplyKeyboardRemove
            | ForceReply;
        parse_mode?: 'HTML' | 'Markdown';
    }
) {
    try {
        const msg = await ctx.reply(text, extra);

        await addIdsToDel(ctx, msg.message_id);
    } catch (error) {
        console.log('replyWrapper', error);
    }
}
