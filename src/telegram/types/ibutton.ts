import { MessageType } from './message-type.enum';

export interface IButton {
    label: string;
    text: string;
    file?: string;
    fileType?: MessageType;
}
