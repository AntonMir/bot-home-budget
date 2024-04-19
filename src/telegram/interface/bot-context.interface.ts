import { Context, Scenes } from 'telegraf';
import { UserSessionData } from './user-session-data.interface';
import { FileIdService } from '../services/fileId.service';
import { LocalisationService } from '../services/localisation.service';
import { ExcelService } from '../services/excel.service';

export interface BotContext extends Context {
    fileId: FileIdService;
    loc: LocalisationService;
    excel: ExcelService;
    session: UserSessionData;
    scene: Scenes.SceneContextScene<BotContext>;
}