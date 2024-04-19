import { Logger, setLogger } from '../../utils/logger';
import * as XLSX from 'xlsx';
import { NarrowedContext } from 'telegraf';
import { BotContext } from '../interface/bot-context.interface';
import { Message, Update } from 'telegraf/types';
import { Excel } from '../type/excel.type';
import * as fs from 'fs';
import {
    IExcelStoreTransactions,
} from '../interface/excel.interface';
import { TimeService } from './time.service';

export class ExcelService {
    private readonly logger: Logger
    private readonly timeService: TimeService

    constructor() {
        this.logger = setLogger({ name: ExcelService.name })
        this.timeService = new TimeService()
    }

    /**
     * Парсинг .excel в JSON формат
     * @param ctx
     */
    async excelToJson(ctx: NarrowedContext<BotContext, {message: (Update.New & Update.NonChannel & Message.AnimationMessage) | (Update.New & Update.NonChannel & Message.DocumentMessage), update_id: number}>): Promise<Excel[]> {
        try {
            // Получите file_id документа
            const fileId = ctx.message.document.file_id;

            // Получите информацию о файле и ссылку для загрузки
            const link = await ctx.telegram.getFileLink(fileId);

            // Используйте link для загрузки файла и сохранения на диск
            let response = await fetch(link);
            let arrayBuffer = await response.arrayBuffer();
            let buffer = Buffer.from(arrayBuffer);
            let filename = ctx.message.document.file_name;
            fs.writeFileSync(filename, buffer);

            // Парсинг файла Excel
            const workbook = XLSX.readFile(filename);
            let data: Excel[][] = [];
            workbook.SheetNames.forEach((sheetName) => {
                // Преобразуйте лист в JSON
                let sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                data.push(sheetData);
            });

            fs.unlinkSync(filename);

            return data[0]
        } catch(error) {
            this.logger.error('excelParser', error)
        }
    }

    /**
     * Сортировка данных по категориям и суммам общий расходов по ним
     * @param data
     */
    getAllSortedExcelStoreTransactions(data: Excel[]): IExcelStoreTransactions {
        try {
            const storeList: IExcelStoreTransactions = {}

            data.forEach((operation: Excel) => {
                // Сервисы/Магазины
                if(!['Переводы', 'Пополнения', undefined].includes(operation['Категория'])) {
                    if(!storeList[operation['Категория']]) {
                        storeList[operation['Категория']] = {
                            description: operation['Описание'] || '-',
                            amount: +operation['Сумма операции'].toFixed(2) || 0
                        }
                    } else {
                        storeList[operation['Категория']].amount
                            = +storeList[operation['Категория']].amount.toFixed(2)
                            + +operation['Сумма операции'].toFixed(2) || 0
                    }
                }
            })

            return storeList
        } catch(error) {
            this.logger.error(`getAllSortedExcelStoreTransactions`, error)
        }
    }

    /**
     * Отфильтрованный по категории excel JSON
     * @param data
     * @param category
     */
    getTransactionsFromCategory(data: Excel[], category: string): Excel[] {
        try {
            const transactionsList = data.filter(el => {
                return el['Категория'] === category
            })

            return this.excelSorter(transactionsList)
        } catch(error) {
            this.logger.error(`getTransactionsFromCategory`, error)
            return data
        }
    }

    /**
     * Сортировка по дате платежа от меньшего к большему
     * @param data
     */
    excelSorter(data: Excel[]) {
        try {
            return data.sort((a, b) => {
                const dateA = this.timeService.getDateFromString(a['Дата платежа']); // Получаем дату из строки a
                const dateB = this.timeService.getDateFromString(b['Дата платежа']); // Получаем дату из строки b
                return dateA.getTime() - dateB.getTime(); // Сравниваем миллисекунды
            })
        } catch(error) {
            this.logger.error(`excelSorter`, error)
            return data
        }
    }
}


// TINKOFF EXAMPLE:
// {
//     'Дата операции': '03.04.2024 12:45:51',
//     'Дата платежа': '03.04.2024',
//     'Номер карты': '*9775',
//     'Статус': 'OK',
//     'Сумма операции': -376,
//     'Валюта операции': 'RUB',
//     'Сумма платежа': -376,
//     'Валюта платежа': 'RUB',
//     'Кэшбэк': 3,
//     'Категория': 'Сервис',
//     MCC: 5964,
//     'Описание': 'Ozon.ru',
//     'Бонусы (включая кэшбэк)': 3,
//     'Округление на инвесткопилку': 0,
//     'Сумма операции с округлением': 376
// },
// {
//     'Дата операции': '03.04.2024 12:44:26',
//     'Дата платежа': '03.04.2024',
//     'Статус': 'OK',
//     'Сумма операции': -300,
//     'Валюта операции': 'RUB',
//     'Сумма платежа': -300,
//     'Валюта платежа': 'RUB',
//     'Категория': 'Переводы',
//     'Описание': 'Алена Г.',
//     'Бонусы (включая кэшбэк)': 0,
//     'Округление на инвесткопилку': 0,
//     'Сумма операции с округлением': 300
// },

