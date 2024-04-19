import { SCENES } from '../enum/scenes-list.enum';
import { Markup, Scenes } from 'telegraf';
import { Logger, setLogger } from '../../utils/logger';
import { BotContext } from '../interface/bot-context.interface';
import MessageCleanerService from '../services/message-cleaner.service';
import {
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
    const sortedExcelP2PTransactions: Excel[] = ctx.excel.getTransactionsFromCategory(excel, 'Переводы')
    // Все пополнения карт
    const sortedExcelReplenishment: Excel[] = ctx.excel.getTransactionsFromCategory(excel, 'Пополнения')

    // запишем в ctx
    ctx.session.excel = excel

    // составим TXT и покажем результаты подсчетов юзеру
    // ВСЕ STORE
    let storeGlobalAmount = 0
    let excelText: string = `${ctx.loc.get('STORE')}\n\n`
    for(let key in sortedExcelStoreTransactions) {
        storeGlobalAmount += sortedExcelStoreTransactions[key].amount
        excelText += `${key}: <b>${sortedExcelStoreTransactions[key].amount}</b>\n`
    }
    excelText += `\nИтог: ${storeGlobalAmount.toFixed(2)}\n`

    // ВСЕ P2P
    let p2pGlobalAmount = 0
    excelText += `\n\n${ctx.loc.get('P2P')}\n\n`
    sortedExcelP2PTransactions.forEach(transaction => {
        p2pGlobalAmount += transaction['Сумма операции']
        excelText += `(${transaction['Дата платежа']}) ${transaction['Описание']}: <b>${transaction['Сумма операции']}</b>\n`
    })
    excelText += `\nИтог: ${p2pGlobalAmount.toFixed(2)}\n`

    // Все пополнения карт
    let replGlobalAmount = 0
    excelText += `\n\n${ctx.loc.get('REPLENISH')}\n\n`
    sortedExcelReplenishment.forEach(replenish => {
        replGlobalAmount += replenish['Сумма операции']
        excelText += `(${replenish['Дата платежа']}) ${replenish['Описание']}: <b>${replenish['Сумма операции']}</b>\n`
    })
    excelText += `\nИтог: ${replGlobalAmount.toFixed(2)}\n`

    // Отправляем все юзеру
    const message = await ctx.replyWithHTML(excelText, {
        ...Markup.inlineKeyboard([
            [Markup.button.callback(ctx.loc.get('STORE_BTN'), 'store')],
            [Markup.button.callback(ctx.loc.get('P2P_BTN'), 'p2p')],
            [Markup.button.callback(ctx.loc.get('REPLENISH_BTN'), 'replenish')],
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
        let storeGlobalAmount = 0
        let excelStoreListText: string = `${ctx.loc.get('STORE')}\n\n`
        for(let key in sortedExcelStoreTransactions) {
            storeGlobalAmount += sortedExcelStoreTransactions[key].amount
            excelStoreListText += `${key}: <b>${sortedExcelStoreTransactions[key].amount}</b>\n`
        }
        excelStoreListText += `\n Итог: ${storeGlobalAmount.toFixed(2)}`

        const message = await ctx.replyWithHTML(excelStoreListText, {
            ...generateStoreKeyboard(ctx, sortedExcelStoreTransactions)
        });
        ctx.session.messageIds.push(message.message_id)
    });

    // CATEGORY
    excelScene.action(/category-.*/, async (ctx: BotMatchContext) => {
        await messageCleaner.messageClean(ctx)

        const category = ctx.match.input.split('-')[1]

        const storeList: Excel[] = ctx.excel.getTransactionsFromCategory(ctx.session.excel, category)

        let text = `<b>${category}:</b>\n\n`

        let chosenCategoryAmount: number = 0

        storeList.forEach((store: Excel) => {
            text += `(${store['Дата платежа']}) ${store['Описание']}: <b>${store['Сумма операции']}</b>\n`
            chosenCategoryAmount += store['Сумма операции']
        })

        text += `\n<b>Общая сумма: ${chosenCategoryAmount.toFixed(2)}</b>`

        const message = await ctx.replyWithHTML(text, {
            ...Markup.inlineKeyboard([
                [Markup.button.callback(ctx.loc.get('BACK_BTN'), 'store')]
            ])
        })
        ctx.session.messageIds.push(message.message_id)
    });

    // P2P все переводы P2P
    excelScene.action('p2p', async (ctx: BotContext) => {
        await messageCleaner.messageClean(ctx)
        const message = await ctx.replyWithHTML('Раздел в разработке', {
            ...Markup.inlineKeyboard([
                [Markup.button.callback(ctx.loc.get('BACK_BTN'), 'toExcelScene')]
            ])
        })
        ctx.session.messageIds.push(message.message_id)
    })

    // ПОПОЛНЕНИЯ КАРТ
    excelScene.action('replenish', async (ctx: BotContext) => {
        await messageCleaner.messageClean(ctx)
        const message = await ctx.replyWithHTML('Раздел в разработке', {
            ...Markup.inlineKeyboard([
                [Markup.button.callback(ctx.loc.get('BACK_BTN'), 'toExcelScene')]
            ])
        })
        ctx.session.messageIds.push(message.message_id)
    })

    // toExcelScene
    excelScene.action('toExcelScene', async (ctx) => {
        await ctx.scene.enter(SCENES.EXCEL)
    });

    // uploadNewExcel
    excelScene.action('uploadNewExcel', async (ctx) => {
        ctx.session.isFirstExcelOnLoad = true
        await ctx.scene.enter(SCENES.EXCEL)
    });
}
