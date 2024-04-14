import { Markup, NarrowedContext, Scenes } from 'telegraf';
import { BotContext, Lead } from '../context';
import { messageClean } from '../utils/messageCleaner';
import { flow } from '../utils/flow';
import { addIdsToDel } from '../utils/idsAdderToDB';
import { PUSH_ACTIONS } from '../push/push.interface';
import { sendMessageLead } from '../utils/findUser';
import { message } from 'telegraf/filters';
import { MessageType } from '../types/message-type.enum';
import { Update } from 'telegraf/types';
import { processMessage } from '../utils/processMessage';
import { sleep } from '../utils/sleep';
import { unsupportedFileMessage } from '../utils/unsupportedFileMessage';

const sendMailingMenuKeyboard = (ctx: BotContext) => {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback(
                ctx.loc._('BTN_TEMPLATE_MAILING_NO'),
                'goToMenu'
            ),
        ],
    ]);
};

const menuKeyboard = (ctx: BotContext) => {
    return Markup.inlineKeyboard([
        [Markup.button.callback(ctx.loc._('MAIN_MENU'), 'goToMenu')],
    ]);
};

const sendMailingKeyboard = (ctx: BotContext) => {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback(
                ctx.loc._('BTN_TEMPLATE_MAILING_NO'),
                'goToMenu'
            ),
        ],
        [
            Markup.button.callback(
                ctx.loc._('BTN_TEMPLATE_MAILING_YES'),
                'yes_send_message'
            ),
        ],
    ]);
};

export default (sendMailing: Scenes.BaseScene<BotContext>): void => {
    sendMailing.enter(async (ctx) => {
        await messageClean(ctx);
        const lead: Lead = ctx.session.leadList[0];
        const msg = await ctx.reply(
            ctx.loc._('SEND_MAILING_MENU_MESSAGE', lead.username, lead.id),
            {
                parse_mode: 'HTML',
                ...sendMailingMenuKeyboard(ctx),
            }
        );
        await addIdsToDel(ctx, msg.message_id);
        await ctx.flow(ctx, '1/2');
    });

    sendMailing.action('yes_send_message', async (ctx) => {
        const sended = await sendMessageLead(ctx, ctx.session.leadList[0]);
        if (!sended) {
            await ctx.answerCbQuery(
                ctx.loc._('USER_PERSONAL_MESSAGE_CLOSED_MESSAGE'),
                {
                    show_alert: true,
                }
            );
            await flow(ctx, '2.1/2');
        } else {
            await messageClean(ctx);
            const msg = await ctx.reply(
                ctx.loc._('SEND_MAILING_SUCCESS_MESSAGE'),
                {
                    parse_mode: 'HTML',
                    ...menuKeyboard(ctx),
                }
            );
            await addIdsToDel(ctx, msg.message_id);
            await flow(ctx, '2.2/2');
        }
    });

    sendMailing.action('goToMenu', async (ctx) => {
        await ctx.scene.enter('mainMenu');
    });

    sendMailing.hears(/.*/, async (ctx, next) => {
        let userInput: string | number = ctx.match.input || ctx.message.text;

        const ignoreActions = [
            ...Object.keys(PUSH_ACTIONS),
            'slaReset',
            'start',
            'updateWorker',
        ];

        if (ignoreActions.includes(userInput.replace('/', ''))) {
            return await next();
        }

        const stringLength =
            (await ctx.loc._('SEND_MAILING_MESSAGE').length) + userInput.length;
        if (stringLength > 4096) {
            try {
                ctx.deleteMessage();
            } catch (error) {}
            const msg = await ctx.reply(ctx.loc._('MESSAGE_TO_LONG_ERROR'), {
                parse_mode: 'HTML',
            });
            await flow(ctx, '2.1.1/2');
            await sleep(1_500);
            try {
                await ctx.deleteMessage(msg.message_id);
            } catch (error) {
                console.error(`MessageToLong > Error: ${error}`);
            }
            return await next();
        }

        await processMessage(
            ctx,
            MessageType.TEXT,
            ctx.replyWithHTML.name,
            userInput,
            0,
            sendMailingKeyboard(ctx),
            'SEND_MAILING_MESSAGE',
            '2/2'
        );
        // await processMessage(
        //     ctx,
        //     MessageType.TEXT,
        //     ctx.replyWithHTML.name,
        //     userInput
        // );
        //await flow(ctx, '2/2');
    });

    // function setMedia(ctx: BotContext, message) {
    //     console.log(2);
    //     if (!ctx.session.leadList[0].files) ctx.session.leadList[0].files = [];

    //     if (message?.['photo']) {
    //         message = message as Message.PhotoMessage;
    //         const fileId = message.photo[message.photo.length - 1].file_id;

    //         ctx.session.leadList[0].files.push({
    //             type: MessageType.PHOTO,
    //             media: fileId,
    //         });
    //     } else if (message?.['video']) {
    //         message = message as Message.VideoMessage;
    //         const fileId = message.video.file_id;

    //         ctx.session.leadList[0].files.push({
    //             type: MessageType.VIDEO,
    //             media: fileId,
    //         });
    //     }
    // }

    // sendMailing.on(message('media_group_id'), async (ctx, next) => {
    //     console.log(1);
    //     const message = ctx.message;
    //     if (!ctx.session.mediaGroupId) {
    //         setTimeout(async () => {
    //             console.log('test', ctx.session.leadList[0].files);
    //             const buff: any = ctx.session.leadList[0].files;

    //             //ctx.replyWithMediaGroup(buff);

    //             try {
    //                 ctx.deleteMessage();
    //             } catch (error) {}
    //             await messageClean(ctx);
    //             const lead = ctx.session.leadList[0];

    //             buff[0]['caption'] = ctx.loc._(
    //                 'SEND_MAILING_MESSAGE',
    //                 lead.message || '',
    //                 lead.username,
    //                 lead.id
    //             );
    //             buff[0]['parse_mode'] = 'HTML';
    //             buff[0] = { ...sendMailingKeyboard(ctx) };
    //             console.log(buff);

    //             //...sendMailingKeyboard(ctx)
    //             const messages = await ctx.replyWithMediaGroup(f);
    //             for (const msg of messages) {
    //                 await addIdsToDel(ctx, msg.message_id);
    //             }

    //             await flow(ctx, '2/2');
    //         }, 1000);
    //         ctx.session.mediaGroupId = message.media_group_id;
    //     }
    //     setMedia(ctx, message);

    //     return next();
    // });

    // async function processMessage(
    //     ctx: NarrowedContext<BotContext, Update.MessageUpdate>,
    //     _type: MessageType,
    //     replyTag: string,
    //     fileId: string
    // ) {
    //     const caption: string | null = ctx.update.message['caption'];
    //     if (caption) {
    //         ctx.session.leadList[0].messages[0] = {
    //             media: caption,
    //             type: MessageType.TEXT,
    //             replyTag: ctx.replyWithHTML.name,
    //         };
    //     }

    //     if (_type === MessageType.TEXT) {
    //         ctx.session.leadList[0].messages[0] = {
    //             media: fileId,
    //             type: _type,
    //             replyTag: replyTag,
    //         };
    //     } else {
    //         ctx.session.leadList[0].messages[1] = {
    //             media: fileId,
    //             type: _type,
    //             replyTag: replyTag,
    //         };
    //     }

    //     try {
    //         ctx.deleteMessage();
    //     } catch (error) {}
    //     await messageClean(ctx);
    //     const lead = ctx.session.leadList[0];
    //     if (lead.messages[1]) {
    //         const fileMessage = await ctx[lead.messages[1].replyTag](
    //             lead.messages[1].media,
    //             {
    //                 parse_mode: 'HTML',
    //             }
    //         );
    //         await addIdsToDel(ctx, fileMessage.message_id);
    //     }
    //     const msg = await ctx.reply(
    //         ctx.loc._(
    //             'SEND_MAILING_MESSAGE',
    //             lead.messages[0]?.media || '',
    //             lead.username,
    //             lead.id
    //         ),
    //         { parse_mode: 'HTML', ...sendMailingKeyboard(ctx) }
    //     );

    //     await addIdsToDel(ctx, msg.message_id);
    //     await flow(ctx, '2/2');
    // }

    sendMailing.on(message('video'), async (ctx, next) => {
        if (ctx.message?.['media_group_id']) return next();
        const videoId = ctx.update.message.video.file_id;
        await processMessage(
            ctx,
            MessageType.VIDEO,
            ctx.replyWithVideo.name,
            videoId,
            0,
            sendMailingKeyboard(ctx),
            'SEND_MAILING_MESSAGE',
            '2/2'
        );
    });

    sendMailing.on(message('photo'), async (ctx, next) => {
        if (ctx.message?.['media_group_id']) return next();
        const photoArray = ctx.update.message.photo;
        const photoId = photoArray[photoArray.length - 1].file_id;
        await processMessage(
            ctx,
            MessageType.PHOTO,
            ctx.replyWithPhoto.name,
            photoId,
            0,
            sendMailingKeyboard(ctx),
            'SEND_MAILING_MESSAGE',
            '2/2'
        );
    });

    sendMailing.on(message('document'), async (ctx, next) => {
        if (ctx.message?.['media_group_id']) return next();
        const documentId = ctx.update.message.document.file_id;
        await processMessage(
            ctx,
            MessageType.DOCUMENT,
            ctx.replyWithDocument.name,
            documentId,
            0,
            sendMailingKeyboard(ctx),
            'SEND_MAILING_MESSAGE',
            '2/2'
        );
    });

    sendMailing.on(message('audio'), async (ctx, next) => {
        if (ctx.message?.['media_group_id']) return next();
        const documentId = ctx.update.message.audio.file_id;
        await processMessage(
            ctx,
            MessageType.AUDIO,
            ctx.replyWithAudio.name,
            documentId,
            0,
            sendMailingKeyboard(ctx),
            'SEND_MAILING_MESSAGE',
            '2/2'
        );
    });

    sendMailing.on(message('animation'), async (ctx, next) => {
        if (ctx.message?.['media_group_id']) return next();
        const animationId = ctx.update.message.animation.file_id;
        await processMessage(
            ctx,
            MessageType.ANIMATION,
            ctx.replyWithAnimation.name,
            animationId,
            0,
            sendMailingKeyboard(ctx),
            'SEND_MAILING_MESSAGE',
            '2/2'
        );
    });

    sendMailing.on(message('contact'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });

    sendMailing.on(message('location'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });

    sendMailing.on(message('invoice'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });

    sendMailing.on(message('voice'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });

    sendMailing.on(message('video_note'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });

    sendMailing.on(message('sticker'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });

    sendMailing.on(message('dice'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });
};
