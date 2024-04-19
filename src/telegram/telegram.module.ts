import { Scenes, session, Telegraf } from 'telegraf';
import { BotContext } from './interface/bot-context.interface';
import { FileIdService } from './services/fileId.service';
import scenes from './scenes';
import { LocalisationService } from './services/localisation.service';
import { setLogger, Logger } from '../utils/logger';
import ConfigService from '../services/config.service';
import { ExcelService } from './services/excel.service';


export class TelegramModule {
    private readonly logger: Logger
    private readonly configService: ConfigService
    private readonly botToken: string

    constructor() {
        this.logger = setLogger({name: TelegramModule.name})
        this.configService = new ConfigService()
        this.botToken = this.configService.get('TELEGRAM__BOT_TOKEN')
    }

    async startBot() {
        const bot = new Telegraf<BotContext>(this.botToken);

        // ignore chats and channels
        bot.use(async (ctx, next) => {
            if (!ctx.from) return;
            if (!ctx.chat) return;
            if (ctx.chat.type !== 'private') return;
            await next();
        });

        // Session
        bot.use(session());

        // Localisation
        bot.context.loc = new LocalisationService();
        bot.context.fileId = new FileIdService();

        // Excel service
        bot.context.excel = new ExcelService()

        // Configure stage
        let stage = new Scenes.Stage<BotContext>();
        bot.use(stage.middleware());
        bot.catch((err) => {
            console.error(err);
        });

        // Handlers
        try {
            scenes(bot, stage);
        } catch (error) {
            this.logger.error(error);
        }

        await bot.launch()
    };
}