import { Logger, setLogger } from '../../utils/logger';
import * as XLSX from 'xlsx';
import { NarrowedContext } from 'telegraf';
import { BotContext } from '../interface/bot-context.interface';
import { Message, Update } from 'telegraf/types';
import { Excel } from '../type/excel.type';
import * as fs from 'fs';
import {
    IExcelP2PTransactions,
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


    getAllSortedExcelStoreTransactions(data: Excel[]): IExcelStoreTransactions {
        try {
            const storeList: IExcelStoreTransactions = {}

            data.forEach((operation: Excel) => {
                // Сервисы/Магазины
                if(operation['Категория'] !== 'Переводы') {
                    if(!storeList[operation['Категория']]) {
                        storeList[operation['Категория']] = {
                            description: operation['Описание'] || '-',
                            amount: +operation['Сумма операции'].toFixed(2) || 0
                        }
                    }
                    storeList[operation['Категория']].amount
                        = +storeList[operation['Категория']].amount.toFixed(2)
                        + +operation['Сумма операции'].toFixed(2) || 0
                }
            })

            return storeList
        } catch(error) {
            this.logger.error(`getAllSortedExcelStoreTransactions`, error)
        }
    }

    /**
     * P2P
     * @param data
     */
    getAllSortedExcelP2PTransactions(data: Excel[]): IExcelP2PTransactions[] {
        try {
            const p2pList: IExcelP2PTransactions[] = []

            data.forEach((operation: Excel) => {
                if(operation['Категория'] === 'Переводы') {
                    // TODO: убрать кастомные поля на английском языке
                    p2pList.push({
                        description: operation['Описание']  || '-',
                        amount: operation['Сумма операции']  || 0,
                        cardNum: operation['Номер карты'] || '-',
                        datePayment: operation['Дата платежа'] || '-'
                    })
                }
            })

            p2pList.sort((a, b) => {
                const dateA = this.timeService.getDateFromString(a.datePayment); // Получаем дату из строки a
                const dateB = this.timeService.getDateFromString(b.datePayment); // Получаем дату из строки b
                return dateA.getTime() - dateB.getTime(); // Сравниваем миллисекунды
            })

            return p2pList
        } catch(error) {
            this.logger.error(`getAllSortedExcelP2PTransactions`, error)
        }
    }

    /**
     * Отфильтрованный excel
     * @param data
     * @param category
     */
    getFilteredStoreFromCategory(data: Excel[], category: string): Excel[] {
        try {
            const storeList: Excel[] = []

            data.forEach((operation: Excel) => {
                if(operation['Категория'] === category) {
                    storeList.push(operation)
                }
            })

            storeList.sort((a, b) => {
                const dateA = this.timeService.getDateFromString(a['Дата платежа']); // Получаем дату из строки a
                const dateB = this.timeService.getDateFromString(b['Дата платежа']); // Получаем дату из строки b
                return dateA.getTime() - dateB.getTime(); // Сравниваем миллисекунды
            })

            return storeList
        } catch(error) {
            this.logger.error(`getFilteredStoreFromCategory`, error)
        }
    }
}

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

