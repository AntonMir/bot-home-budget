import { MessageType } from './message-type.enum';

export interface IMessage {
    type: MessageType;
    media: string;
    replyTag: string;
}
