import pino, {DestinationStream, LoggerOptions} from 'pino';
import {Logger} from "pino";

export function setLogger(optionsOrStream?: DestinationStream | LoggerOptions): Logger {
    return pino({
        level: 'debug',
        ...optionsOrStream
    });
}

export { Logger }