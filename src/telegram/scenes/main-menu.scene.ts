import { BotContext } from '../interface/bot-context.interface';
import { Logger, setLogger } from '../../utils/logger';
import { BaseScene } from 'telegraf/scenes';
import { SCENES } from '../enum/scenes-list.enum';
import { Markup, Scenes } from 'telegraf';


export default (mainMenu: Scenes.BaseScene<BotContext>): void => {
    const logger: Logger = setLogger({ name: SCENES.MAIN_MENU })

    mainMenu.enter(async (ctx) => {
        const text = ctx.loc.get('START_HTML')
        const fileName = ctx.loc.get('START_VIDEO')
        const filePath = await ctx.fileId.getFileId(fileName)
        await ctx.replyWithVideo(filePath, {
            caption: text,
            ...Markup.inlineKeyboard([
                [Markup.button.callback('HI', 'action')]
            ])
        })
    });

    // mainMenu.action('goToMenu', async (ctx) => {
    //     await ctx.scene.enter('mainMenu');
    // });

    // mainMenu.on('message', async (ctx, next) => {
    // })

    // mainMenu.hears(/.*/, async (ctx, next) => {
    // });

}



