import { Context, Scenes } from 'telegraf';
import { UserSessionData } from './user-session-data.interface';
import { FileIdService } from '../services/fileId.service';
import { LocalisationService } from '../services/localisation.service';

export interface BotContext extends Context {
    fileId: FileIdService;
    loc: LocalisationService;
    session: UserSessionData;
    scene: Scenes.SceneContextScene<BotContext>;
}