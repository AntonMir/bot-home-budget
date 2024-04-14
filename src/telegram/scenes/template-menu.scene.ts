import { Markup, Scenes } from 'telegraf';
import { BotContext } from '../context';
import { messageClean } from '../utils/messageCleaner';
import { flow } from '../utils/flow';
import { addIdsToDel } from '../utils/idsAdderToDB';
import { PUSH_ACTIONS } from '../push/push.interface';
import {
    findAllLeadsAndSetMessage,
    sendMessageLeadWithStatistic,
} from '../utils/findUser';
import { IButton } from '../types/ibutton';
import { InlineKeyboardButton, InlineKeyboardMarkup } from 'telegraf/types';
import * as scheduler from 'node-schedule';
import { BotUser } from '../models/botUser';
import { MessageType } from '../types/message-type.enum';
import { message } from 'telegraf/filters';
import { processMessage } from '../utils/processMessage';
import { unsupportedFileMessage } from '../utils/unsupportedFileMessage';
import { sleep } from '../utils/sleep';

const eventKeyboard = (ctx: BotContext) => {
    return Markup.inlineKeyboard([
        [Markup.button.callback(ctx.loc._('MAIN_MENU'), 'goToMenu')],
    ]);
};

const templateMenuKeyboard = (
    ctx: BotContext,
    templateButtons?: IButton[]
): InlineKeyboardMarkup => {
    const buttons: InlineKeyboardButton[][] = [
        [
            Markup.button.callback(
                ctx.loc._('BTN_TEMPLATE_MENU_TO_MAIN_MENU'),
                'goToMenu'
            ),
        ],
    ];

    if (templateButtons.length === 0) {
        return {
            inline_keyboard: buttons,
        };
    }

    const buttonsPerPage = ctx.loc._('buttonsPerPage');
    const page = ctx.session.templateMenuPage || 0;
    const totalPages = Math.ceil(templateButtons.length / buttonsPerPage);
    const startIdx = page * buttonsPerPage;
    const endIdx = Math.min(
        (page + 1) * buttonsPerPage,
        templateButtons.length
    );

    for (let index = startIdx; index < endIdx; index++) {
        buttons.push([
            Markup.button.callback(
                templateButtons[index].label,
                `templateButton${index}`
            ),
        ]);
    }

    const paginationButtons: InlineKeyboardButton[] = [];
    if (page > 0) {
        paginationButtons.push(
            Markup.button.callback(
                ctx.loc._('BTN_TEMPLATE_MENU_PREV'),
                'prevPage'
            )
        );
    }
    if (page < totalPages - 1) {
        paginationButtons.push(
            Markup.button.callback(
                ctx.loc._('BTN_TEMPLATE_MENU_NEXT'),
                'nextPage'
            )
        );
    }
    if (paginationButtons.length > 0) {
        buttons.push(paginationButtons);
    }

    return {
        inline_keyboard: buttons,
    };
};

const sendMailingKeyboard = (ctx: BotContext) => {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback(
                ctx.loc._('BTN_TEMPLATE_MAILING_NO'),
                'goToTemplateMenu'
            ),
        ],
        [
            Markup.button.callback(
                ctx.loc._('BTN_TEMPLATE_MAILING_YES'),
                'yes_send'
            ),
        ],
    ]);
};

const sendTemplateKeyboard = (ctx: BotContext) => {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback(
                ctx.loc._('BTN_TEMPLATE_MAILING_YES'),
                'yes_send'
            ),
        ],
        [
            Markup.button.callback(
                ctx.loc._('BTN_TEMPLATE_MAILING_NO'),
                'goToTemplateMenu'
            ),
        ],
    ]);
};

export default (templateMenu: Scenes.BaseScene<BotContext>): void => {
    templateMenu.enter(async (ctx) => {
        await messageClean(ctx);
        const msg = await ctx.reply(ctx.loc._('TEMPLATE_MENU_MESSAGE'), {
            parse_mode: 'HTML',
            reply_markup: templateMenuKeyboard(
                ctx,
                ctx.loc._('templates_json') as IButton[]
            ),
        });
        await addIdsToDel(ctx, msg.message_id);
        await ctx.flow(ctx, '0.3/2');
        ctx.session.leadList = await findAllLeadsAndSetMessage(ctx);
        ctx.session.messageSended = 0;
        ctx.session.messageFailBanSended = 0;
        ctx.session.messageFailTechSended = 0;
    });

    const regex = /templateButton(\d+)/;
    templateMenu.action(regex, async (ctx) => {
        const buttonNumber = Number(ctx.match[1]);
        const templates = ctx.loc._('templates_json') as IButton[];
        for (let i = 0; i < ctx.session.leadList.length; i++) {
            ctx.session.leadList[i].messages[0] = {
                type: MessageType.TEXT,
                replyTag: ctx.replyWithHTML.name,
                media: templates[buttonNumber].text,
            };
        }
        await messageClean(ctx);
        if (templates[buttonNumber].file && templates[buttonNumber].fileType) {
            const fileId = await ctx.fileId.getFileId(
                templates[buttonNumber].file
            );
            const fileType = templates[buttonNumber].fileType;
            const fileTypeLowerCase =
                fileType.charAt(0).toUpperCase() + fileType.slice(1);
            for (const lead of ctx.session.leadList) {
                lead.messages.push({
                    type: fileType,
                    replyTag: `replyWith${fileTypeLowerCase}`,
                    media: fileId,
                });
            }
            const msg = await ctx[`replyWith${fileTypeLowerCase}`](fileId);
            await addIdsToDel(ctx, msg.message_id);
        }
        const msg = await ctx.reply(
            ctx.loc._('TEMPLATE_MAILING_MESSAGE', templates[buttonNumber].text),
            { parse_mode: 'HTML', ...sendTemplateKeyboard(ctx) }
        );
        await addIdsToDel(ctx, msg.message_id);
        await flow(ctx, '0.7/2');
    });

    const sendMessagesInBackground = async (ctx: BotContext) => {
        const job: scheduler.Job = scheduler.scheduleJob('* * * * * *', () => {
            (async () => {
                const msg = await ctx.reply(
                    ctx.loc._('TEMPLATE_MAILING_SENDING')
                );
                await flow(ctx, '0.9/2');
                console.log(
                    `sendMessagesInBackground from ${ctx.session.id} ${ctx.session.username} > START`
                );
                for (
                    let index = 0;
                    index < ctx.session.leadList.length;
                    index++
                ) {
                    const lead = ctx.session.leadList[index];
                    await sendMessageLeadWithStatistic(ctx, lead);
                }
                console.log(
                    `sendMessagesInBackground from ${ctx.session.id} ${ctx.session.username} > COMPLETED`
                );
                await ctx.deleteMessage(msg.message_id);

                const event = await ctx.reply(
                    ctx.loc._(
                        'PUSH_MAILING_SUCCESS_MESSAGE',
                        ctx.session.messageSended,
                        ctx.session.messageFailBanSended,
                        ctx.session.messageFailTechSended
                    ),
                    { parse_mode: 'HTML', ...eventKeyboard(ctx) }
                );

                await BotUser.findOneAndUpdate(
                    {
                        id: ctx.session.id,
                        bot: ctx.botObject._id,
                    },
                    { $push: { 'data.messageIds': event.message_id } }
                );

                await flow(ctx, '5/2');
            })();
            job.cancel();
        });
    };

    templateMenu.action('yes_send', async (ctx) => {
        await messageClean(ctx);
        await sendMessagesInBackground(ctx);
    });

    templateMenu.action('prevPage', async (ctx) => {
        const templateButtons = ctx.loc._('templates_json') as IButton[];
        ctx.session.templateMenuPage = Math.max(
            (ctx.session.templateMenuPage || 0) - 1,
            0
        );
        try {
            await ctx.editMessageReplyMarkup(
                templateMenuKeyboard(ctx, templateButtons)
            );
        } catch (error) {}
    });

    templateMenu.action('nextPage', async (ctx) => {
        const templateButtons = ctx.loc._('templates_json') as IButton[];
        const buttonsPerPage: number = ctx.loc._('buttonsPerPage');
        const totalPages = Math.ceil(templateButtons.length / buttonsPerPage);

        ctx.session.templateMenuPage = Math.min(
            (ctx.session.templateMenuPage || 0) + 1,
            totalPages - 1
        );
        try {
            await ctx.editMessageReplyMarkup(
                templateMenuKeyboard(ctx, templateButtons)
            );
        } catch (error) {}
    });

    templateMenu.hears(/.*/, async (ctx, next) => {
        let userInput: string | number = ctx.match.input || ctx.message.text;
        const ignoreActions = [
            ...Object.keys(PUSH_ACTIONS),
            'slaReset',
            'start',
            'updateWorker',
        ];
        if (ignoreActions.includes(userInput.replace('/', '')))
            return await next();

        const stringLength =
            (await ctx.loc._('WRITED_MAILING_MESSAGE').length) +
            userInput.length;
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
        for (let i = 0; i < ctx.session.leadList.length; i++) {
            await processMessage(
                ctx,
                MessageType.TEXT,
                ctx.replyWithHTML.name,
                userInput,
                i,
                sendMailingKeyboard(ctx),
                'WRITED_MAILING_MESSAGE',
                '0.4/2'
            );
        }
    });

    templateMenu.on(message('photo'), async (ctx, next) => {
        if (ctx.message?.['media_group_id']) return next();
        const photoArray = ctx.update.message.photo;
        const photoId = photoArray[photoArray.length - 1].file_id;
        for (let i = 0; i < ctx.session.leadList.length; i++) {
            await processMessage(
                ctx,
                MessageType.PHOTO,
                ctx.replyWithPhoto.name,
                photoId,
                i,
                sendMailingKeyboard(ctx),
                'WRITED_MAILING_MESSAGE',
                '2/2'
            );
        }
    });

    templateMenu.on(message('document'), async (ctx, next) => {
        if (ctx.message?.['media_group_id']) return next();
        const documentId = ctx.update.message.document.file_id;
        await processMessage(
            ctx,
            MessageType.DOCUMENT,
            ctx.replyWithDocument.name,
            documentId,
            0,
            sendMailingKeyboard(ctx),
            'WRITED_MAILING_MESSAGE',
            '2/2'
        );
    });

    templateMenu.on(message('audio'), async (ctx, next) => {
        if (ctx.message?.['media_group_id']) return next();
        const documentId = ctx.update.message.audio.file_id;
        await processMessage(
            ctx,
            MessageType.AUDIO,
            ctx.replyWithAudio.name,
            documentId,
            0,
            sendMailingKeyboard(ctx),
            'WRITED_MAILING_MESSAGE',
            '2/2'
        );
    });

    templateMenu.on(message('video'), async (ctx, next) => {
        if (ctx.message?.['media_group_id']) return next();
        const videoId = ctx.update.message.video.file_id;
        await processMessage(
            ctx,
            MessageType.VIDEO,
            ctx.replyWithVideo.name,
            videoId,
            0,
            sendMailingKeyboard(ctx),
            'WRITED_MAILING_MESSAGE',
            '2/2'
        );
    });

    templateMenu.on(message('animation'), async (ctx, next) => {
        if (ctx.message?.['media_group_id']) return next();
        const animationId = ctx.update.message.animation.file_id;
        await processMessage(
            ctx,
            MessageType.ANIMATION,
            ctx.replyWithAnimation.name,
            animationId,
            0,
            sendMailingKeyboard(ctx),
            'WRITED_MAILING_MESSAGE',
            '2/2'
        );
    });

    templateMenu.on(message('contact'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });

    templateMenu.on(message('location'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });

    templateMenu.on(message('invoice'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });

    templateMenu.on(message('voice'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });

    templateMenu.on(message('video_note'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });

    templateMenu.on(message('sticker'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });

    templateMenu.on(message('dice'), async (ctx) => {
        await unsupportedFileMessage(ctx, '2.1/2');
    });
};
