import {Client, ClientConfig} from 'pg';
import { setLogger, Logger } from '../utils/logger';
import ConfigService from '../services/config.service';

class DbModule {
    private readonly logger: Logger
    private readonly configService: ConfigService
    private client: Client
    private readonly user: string
    private readonly password: string
    private readonly host: string
    private readonly port: number
    private readonly database: string

    constructor() {
        this.configService = new ConfigService()
        this.logger = setLogger({name: DbModule.name})
        this.user = process.env.POSTGRES__USER
        this.password = process.env.POSTGRES__PASSWORD
        this.host = process.env.POSTGRES__HOST
        this.port = Number(process.env.POSTGRES__PORT)
        this.database = this.configService.get('POSTGRES__DB_NAME')
        this.setClient()
    }

    /**
     * Setting the database connection configuration
     * @param config
     */
    private setClient(config?: ClientConfig) {
        let clientConfig: ClientConfig
        try {
            clientConfig = {
                user: this.user,
                password: this.password,
                host: this.host,
                port: this.port,
                database: this.database,
                ...config
            }
            this.client = new Client(clientConfig)
        } catch(error) {
            this.logger.error(`Error SetClient; ClientConfig: ${clientConfig}`, error)
        }
    }

    // /**
    //  * Database connection
    //  */
    public async connect() {
        await this.client.connect()
            .then(() => this.logger.info(`Connect from: ${this.host}:${this.port} (db: "${this.database}")`))
            .catch((error) => this.logger.error(`Error connect from: ${this.host}:${this.port} (db: "${this.database}")`, error))
    }

    /**
     * Database disconnection
     */
    public async disconnect() {
        await this.client.end()
            .then(() => this.logger.info(`Disconnected from: ${this.host}:${this.port} (db: "${this.database}")`))
            .catch((error) => this.logger.error(`Error disconnected from: ${this.host}:${this.port} (db: "${this.database}")`, error))
    }

    public getClient() {
        return this.client
    }
}

const db = new DbModule()

export default db