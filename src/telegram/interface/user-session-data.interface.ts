import { Scenes } from 'telegraf';

export interface UserSessionData extends Scenes.SceneSessionData {
  // ctx.from fields
  id?: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  // user session fields

  // bot environment
  messageIds?: number[];

  __scenes?: Scenes.SceneSessionData;
}
