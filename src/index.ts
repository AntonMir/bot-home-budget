import {config} from 'dotenv-safe';
config()
import { setLogger, Logger } from './utils/logger';
import { TelegramModule } from './telegram/telegram.module';


(async () => {
    const logger: Logger = setLogger({name: 'App'})
    const telegramModule = new TelegramModule()

    try {
        // STAGE 1: DB CONNECT
        // Example
        // await db.connect()
        // const client = db.getClient()
        // const result = await client.query('SELECT NOW() as current_time')
        // console.log('Current time in the database:', result.rows[0].current_time);
        // await db.disconnect()


        // STAGE 2: start bot
        await telegramModule.startBot()
        // bot.launch({
        //     allowedUpdates: ['message', 'callback_query', 'chat_member'],
        //     dropPendingUpdates: true,
        // }).catch((reason) => {
        //     console.log(`REASONNNN`, reason);
        // });

    } catch(error) {
        logger.error('App Error:', error)
    }
})();
