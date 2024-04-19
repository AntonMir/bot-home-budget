import { Scenes, Telegraf } from 'telegraf';
import init from './init.scene';
import excel from './excel.scene';
import mainMenu from './main-menu.scene';
import { BotContext } from '../interface/bot-context.interface';
import { SCENES } from '../enum/scenes-list.enum';

const mainMenuScene = new Scenes.BaseScene<BotContext>(SCENES.MAIN_MENU);
const excelScene = new Scenes.BaseScene<BotContext>(SCENES.EXCEL);

mainMenuScene.use(init)

export default (
    bot: Telegraf<BotContext>,
    stage: Scenes.Stage<BotContext>
): void => {

    stage.scenes = new Map<string, Scenes.BaseScene<BotContext>>([
        [SCENES.MAIN_MENU, mainMenuScene],
        [SCENES.EXCEL, excelScene],
    ])
    mainMenu(mainMenuScene);
    excel(excelScene)

    bot.use(init)
};
