import Localisation from '../localisation';
import { LocaleEntityLike } from '../type/locale-entity-like.type';

export class LocalisationService {
    get(
        key: keyof typeof Localisation,
        ...args: LocaleEntityLike[]
    ): string {
        let txt = Localisation[String(key)] || String(key);
        for (const arg of args) {
            txt = txt.replace(/\{[a-zA-Z._]*}/, arg);
        }
        return txt;
    }
}
