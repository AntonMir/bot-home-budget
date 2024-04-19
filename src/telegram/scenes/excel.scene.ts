import { SCENES } from '../enum/scenes-list.enum';
import { Markup, Scenes } from 'telegraf';
import { Logger, setLogger } from '../../utils/logger';
import { BotContext } from '../interface/bot-context.interface';
import MessageCleanerService from '../services/message-cleaner.service';
import {
    IExcelP2PTransactions,
    IExcelStoreTransactions,
} from '../interface/excel.interface';
import { Excel } from '../type/excel.type';
import { BotMatchContext } from '../interface/bot-match-context.interface';

/**
 * Генерация главного меню excel парсинга
 */
const generateExcelMainMenu = async (ctx: any, excel: Excel[]) => {
    // все транзакции магазина
    const sortedExcelStoreTransactions: IExcelStoreTransactions = ctx.excel.getAllSortedExcelStoreTransactions(excel)
    // все переводы p2p
    const sortedExcelP2PTransactions: IExcelP2PTransactions[] = ctx.excel.getAllSortedExcelP2PTransactions(excel)

    // запишем в ctx
    ctx.session.excel = excel

    // составим TXT и покажем результаты подсчетов юзеру
    let excelText: string = `${ctx.loc.get('STORE')}:\n\n`
    for(let key in sortedExcelStoreTransactions) {
        excelText += `${key}: <b>${sortedExcelStoreTransactions[key].amount}</b>\n`
    }
    excelText += `\n\n${ctx.loc.get('P2P')}:\n\n`
    sortedExcelP2PTransactions.forEach(transaction => {
        excelText += `(${transaction.datePayment})${transaction.description}: <b>${transaction.amount}</b>\n`
    })

    const message = await ctx.replyWithHTML(excelText, {
        ...Markup.inlineKeyboard([
            [Markup.button.callback(ctx.loc.get('STORE_BTN'), 'store')],
            [Markup.button.callback(ctx.loc.get('P2P_BTN'), 'p2p')],
            [Markup.button.callback(ctx.loc.get('UPLOAD_NEW_EXCEL_FILE_BTN'), 'uploadNewExcel')],
        ])
    });
    ctx.session.messageIds.push(message.message_id)
}

const generateStoreKeyboard = (ctx: BotContext, sortedExcelStoreTransactions: IExcelStoreTransactions) => {
    const keyboard = []
    let buttonRow = [];
    for(let key in sortedExcelStoreTransactions) {
        buttonRow.push(Markup.button.callback(key, `category-${key}`))
        if(buttonRow.length === 2) {
            keyboard.push(buttonRow)
            buttonRow = []
        }
    }
    if(buttonRow.length > 0) keyboard.push(buttonRow)
    return Markup.inlineKeyboard([
            ...keyboard,
        [Markup.button.callback(ctx.loc.get('BACK_BTN'), 'toExcelScene')]
    ])
}

export default (excelScene: Scenes.BaseScene<BotContext>): void => {
    const logger: Logger = setLogger({ name: SCENES.EXCEL })
    const messageCleaner: MessageCleanerService = new MessageCleanerService()

    excelScene.enter(async (ctx) => {
        await messageCleaner.messageClean(ctx)
        if(ctx.session.isFirstExcelOnLoad === true) {
            const text = ctx.loc.get('FILE_UPLOAD_REQUEST_HTML')
            const message = await ctx.replyWithHTML(text)
            ctx.session.messageIds.push(message.message_id)
            return
        }
        // MAIN MENU FULL EXCEL все транзакции
        return await generateExcelMainMenu(ctx, ctx.session.excel)
    });

    // MAIN MENU FULL EXCEL все транзакции
    excelScene.on('document', async (ctx) => {
        if(ctx.session.isFirstExcelOnLoad === true) {
            await messageCleaner.messageClean(ctx)
            const excel: Excel[] = await ctx.excel.excelToJson(ctx)
            await generateExcelMainMenu(ctx, excel)
            ctx.session.isFirstExcelOnLoad = false
        }
    });

    // STORE все транзакции магазинов
    excelScene.action('store', async (ctx) => {
        await messageCleaner.messageClean(ctx)
        // все транзакции магазинов
        const sortedExcelStoreTransactions: IExcelStoreTransactions = ctx.excel.getAllSortedExcelStoreTransactions(ctx.session.excel)
        // составим TXT и покажем результаты подсчетов юзеру
        let excelStoreListText: string = `${ctx.loc.get('STORE')}\n`
        for(let key in sortedExcelStoreTransactions) {
            excelStoreListText += `${key}: <b>${sortedExcelStoreTransactions[key].amount}</b>\n`
        }

        const message = await ctx.replyWithHTML(excelStoreListText, {
            ...generateStoreKeyboard(ctx, sortedExcelStoreTransactions)
        });
        ctx.session.messageIds.push(message.message_id)
    });

    excelScene.action('p2p', async (ctx: BotContext) => {
        await messageCleaner.messageClean(ctx)
        const message = await ctx.replyWithHTML('Раздел в разработке', {
            ...Markup.inlineKeyboard([
                [Markup.button.callback(ctx.loc.get('BACK_BTN'), 'toExcelScene')]
            ])
        })
        ctx.session.messageIds.push(message.message_id)
    })

    excelScene.action('toExcelScene', async (ctx) => {
        await ctx.scene.enter(SCENES.EXCEL)
    });

    excelScene.action('uploadNewExcel', async (ctx) => {
        ctx.session.isFirstExcelOnLoad = true
        await ctx.scene.enter(SCENES.EXCEL)
    });

    excelScene.action(/category-.*/, async (ctx: BotMatchContext) => {
        await messageCleaner.messageClean(ctx)

        const category = ctx.match.input.split('-')[1]
        const storeList: Excel[] = ctx.excel.getFilteredStoreFromCategory(ctx.session.excel, category)

        let text = `<b>${category}:</b>\n\n`

        let chosenCategoryAmount: number = 0

        storeList.forEach((store: Excel) => {
            text += `(${store['Дата платежа']}) ${store['Описание']}: <b>${store['Сумма операции']}</b>\n`
            chosenCategoryAmount += store['Сумма операции']
        })

        text += `\n<b>Общая сумма: ${chosenCategoryAmount}</b>`

        const message = await ctx.replyWithHTML(text, {
            ...Markup.inlineKeyboard([
                [Markup.button.callback(ctx.loc.get('BACK_BTN'), 'store')]
            ])
        })
        ctx.session.messageIds.push(message.message_id)
    });
}

// excelScene.on('message', async (ctx, next) => {
// })

// excelScene.hears(/.*/, async (ctx, next) => {
// });


    // if (!ctx.session.agreement) {
    //     await BotUser.updateOne(
    //         { id: ctx.from.id, bot: ctx.botObject._id },
    //         { $set: { id: ctx.from.id, bot: ctx.botObject._id } },
    //         { upsert: true }
    //     );
    //     const worker = await Workers.findOne({
    //         telegramId: ctx.from.id,
    //     });
    //     const _role = worker !== null ? ROLE.ADMIN : ROLE.USER;
    //     ctx.session = {
    //         ...ctx.session,
    //         ...ctx.from,
    //         agreement: false,
    //         invitedUsers: [],
    //         role: _role,
    //         leadList: [],
    //         templateMenuPage: 0,
    //         messageSended: 0,
    //         messageFailBanSended: 0,
    //         messageFailTechSended: 0,
    //         messageIds: [],
    //         lastActivity: new Date(),
    //     };
    //     if (ctx.startPayload) {
    //         const payload = ctx.startPayload.split('-');
    //         if (payload.length > 1) {
    //             const smartLinkId = payload[0];
    //             const buyerTag = payload[1];
    //             const subId = payload[2];
    //             try {
    //                 await leadBot(ctx, smartLinkId, buyerTag, subId);
    //                 //if (lead !== false) await leadPush(ctx, subId);
    //             } catch (e) {
    //                 console.error(e);
    //             }
    //         } else {
    //             try {
    //                 await leadBot(ctx, ctx.startPayload);
    //                 // if (lead !== false) await leadPush(ctx, payload[0]);
    //             } catch (e) {
    //                 console.error(e);
    //             }
    //         }
    //     }
    // } else {
    //     await ctx.scene.enter('mainMenu');
    // }

// InitScene.command('slaReset', async (ctx, next) => {
//     if (process.env.BOT_DEV_COMMANDS === 'off') return next();
//     await BotUser.deleteOne({ id: ctx.from.id, bot: ctx.botObject._id });
//     ctx.session = {
//         __scenes: {},
//     };
//     await ctx.reply('Successful reset. /start');
// });
//
// InitScene.command('updateWorker', async (ctx, next) => {
//     if (process.env.BOT_DEV_COMMANDS === 'off') return next();
//     const worker = await Workers.findOne({
//         telegramId: ctx.from.id,
//     });
//     const _role = worker !== null ? ROLE.ADMIN : ROLE.USER;
//     const user = await BotUser.findOne({
//         id: ctx.from.id,
//         bot: ctx.botObject._id,
//     });
//     if (!user) return next();
//     else {
//         await BotUser.updateOne(
//             {
//                 id: ctx.from.id,
//                 bot: ctx.botObject._id,
//             },
//             {
//                 $set: {
//                     'data.role': _role,
//                 },
//             }
//         );
//         ctx.session.role = _role;
//         await ctx.reply(`Successful updatedWorker. Role is ${_role}`);
//     }
// });
//
// InitScene.action('goToMenu', async (ctx) => {
//     await ctx.scene.enter('mainMenu');
// });
//
// InitScene.action('goToTemplateMenu', async (ctx) => {
//     await ctx.scene.enter('templateMenu');
// });


