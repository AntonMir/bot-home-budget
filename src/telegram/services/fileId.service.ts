import { Message } from 'telegraf/types';

export class FileIdService {
    private readonly storage: Record<string, any>;

    constructor() {
        this.storage = {};
    }

    async getFileId(fileId: string) {
        try {
            if (this.storage[fileId]) return this.storage[fileId];
            return {
                source: process.cwd() + '/src/assets/' + fileId,
            };
        } catch(error) {
            console.error(error, {fileId});
        }
    }

    // sentMessage is response of ctx.replyWithPhoto, ctx.replyWithVideo, ctx.replyWithDocument
    async callbackFunction(
        sentMessage:
            | Message.VideoMessage
            | Message.PhotoMessage
            | Message.StickerMessage
            | Message.DocumentMessage,
        fileId: string,
        typeOf: string
    ) {
        const messagePhoto = sentMessage?.[typeOf];
        this.storage[fileId] = sentMessage[messagePhoto?.length - 1]?.file_id;
    }
}
