import { Scenes, session, Telegraf } from 'telegraf';
import { BotContext } from './interface/bot-context.interface';
import { FileIdService } from './services/fileId.service';
import scenes from './scenes';
import { LocalisationService } from './services/localisation.service';
import { setLogger, Logger } from '../utils/logger';
import ConfigService from '../services/config.service';
import { SCENES } from './enum/scenes-list.enum';


export class TelegramModule {
    private readonly configService: ConfigService
    private readonly botToken: string
    private readonly logger: Logger
    private readonly fileIdService: FileIdService

    constructor() {
        this.logger = setLogger({name: TelegramModule.name})
        this.fileIdService = new FileIdService()
        this.configService = new ConfigService()
        this.botToken = this.configService.get('TELEGRAM__BOT_TOKEN')
    }


    async startBot() {
        try {

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
        bot.context.fileId = this.fileIdService;


        // Configure stage
        let stage = new Scenes.Stage<BotContext>();
        bot.use(stage.middleware());
        bot.catch((err) => {
            console.error(err);
        });

        // bot.start(async ctx => {
        //     console.log(`bot.start`, bot.start)
        //     ctx.scene.enter(SCENES.MAIN_MENU)
        // })


        // Handlers
        try {
            scenes(bot, stage);
        } catch (error) {
            this.logger.error(error);
        }

        bot.start(async ctx => {
            await ctx.scene.enter(SCENES.INIT)
        })


        await bot.launch()

        return bot;
        } catch(e) {
            console.log(`e`, e)
        }

    };

}