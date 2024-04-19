import { BotContext } from '../interface/bot-context.interface';
import { SCENES } from '../enum/scenes-list.enum';
import { Composer } from 'telegraf';
import { Logger, setLogger } from '../../utils/logger';

const logger: Logger = setLogger({ name: SCENES.INIT })

const init = new Composer<BotContext>();

init.start(async (ctx) => {
    ctx.session = {
        ...ctx.session,
        ...ctx.from,
        isFirstExcelOnLoad: true,
        messageIds: [],
    };

    await ctx.scene.enter(SCENES.EXCEL)
});

init.command('reset', async (ctx) => {
        // await BotUser.deleteOne({ id: ctx.from.id, bot: ctx.botObject._id });
        ctx.session = {
            __scenes: {},
        };
    await ctx.reply('Successful reset. /start');
});

export default init
