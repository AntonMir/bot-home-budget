export interface ITinkoffExcel {
    'Дата операции'?: string; //'16.04.2024 18:04:55',
    'Дата платежа'?: string; //'16.04.2024',
    'Номер карты'?: string // '*9775'
    'Статус'?: string; // 'OK',
    'Сумма операции'?: number; // -2977,
    'Валюта операции'?: string; // 'RUB',
    'Сумма платежа'?: number; // -2977,
    'Валюта платежа'?: string; // 'RUB',
    'Категория'?: string; // 'Цифровые товары',
    MCC?: number; // 5816,
    'Описание'?: string; // 'Pike',
    'Бонусы (включая кэшбэк)'?: number; // 0,
    'Округление на инвесткопилку'?: number; // 0,
    'Сумма операции с округлением'?: number; // 2977
}

// TODO
// :Excel
export interface IExcelP2PTransactions {
    description: string,
    amount: number,
    cardNum: string,
    datePayment: string
}

// TODO
// [key: string]: Excel
export interface IExcelStoreTransactions {
    [key: string]: {
        description: string,
        amount: number,
    }
}