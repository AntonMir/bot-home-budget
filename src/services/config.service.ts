import { setLogger, Logger } from '../utils/logger';

export default class ConfigService {
    private readonly logger: Logger

    constructor() {
        this.logger = setLogger({ name: ConfigService.name }); // Инициализация logger в конструкторе
    }

    public get(key: string): string {
        try {
            const result = process.env[key]
            if(!result) {
                throw new Error(`Environment variable "${key}" is not set!`);
            }
            return result;
        } catch(error) {
            this.logger.error(error.message)
            throw error;
        }
    }
}