import { SCENES } from '../enum/scenes-list.enum';
import { Scenes } from 'telegraf';
import { Logger, setLogger } from '../../utils/logger';
import { BotContext } from '../interface/bot-context.interface';

export default (excel: Scenes.BaseScene<BotContext>): void => {
    const logger: Logger = setLogger({ name: SCENES.EXCEL })

    excel.enter(async (ctx) => {

    });

    excel.action('action', async (ctx) => {
        console.log(`hi`)
    });

    excel.on('message', async (ctx, next) => {
    })

    excel.hears(/.*/, async (ctx, next) => {
    });

}


    // if (!ctx.session.agreement) {
    //     await BotUser.updateOne(
    //         { id: ctx.from.id, bot: ctx.botObject._id },
    //         { $set: { id: ctx.from.id, bot: ctx.botObject._id } },
    //         { upsert: true }
    //     );
    //     const worker = await Workers.findOne({
    //         telegramId: ctx.from.id,
    //     });
    //     const _role = worker !== null ? ROLE.ADMIN : ROLE.USER;
    //     ctx.session = {
    //         ...ctx.session,
    //         ...ctx.from,
    //         agreement: false,
    //         invitedUsers: [],
    //         role: _role,
    //         leadList: [],
    //         templateMenuPage: 0,
    //         messageSended: 0,
    //         messageFailBanSended: 0,
    //         messageFailTechSended: 0,
    //         messageIds: [],
    //         lastActivity: new Date(),
    //     };
    //     if (ctx.startPayload) {
    //         const payload = ctx.startPayload.split('-');
    //         if (payload.length > 1) {
    //             const smartLinkId = payload[0];
    //             const buyerTag = payload[1];
    //             const subId = payload[2];
    //             try {
    //                 await leadBot(ctx, smartLinkId, buyerTag, subId);
    //                 //if (lead !== false) await leadPush(ctx, subId);
    //             } catch (e) {
    //                 console.error(e);
    //             }
    //         } else {
    //             try {
    //                 await leadBot(ctx, ctx.startPayload);
    //                 // if (lead !== false) await leadPush(ctx, payload[0]);
    //             } catch (e) {
    //                 console.error(e);
    //             }
    //         }
    //     }
    // } else {
    //     await ctx.scene.enter('mainMenu');
    // }

// InitScene.command('slaReset', async (ctx, next) => {
//     if (process.env.BOT_DEV_COMMANDS === 'off') return next();
//     await BotUser.deleteOne({ id: ctx.from.id, bot: ctx.botObject._id });
//     ctx.session = {
//         __scenes: {},
//     };
//     await ctx.reply('Successful reset. /start');
// });
//
// InitScene.command('updateWorker', async (ctx, next) => {
//     if (process.env.BOT_DEV_COMMANDS === 'off') return next();
//     const worker = await Workers.findOne({
//         telegramId: ctx.from.id,
//     });
//     const _role = worker !== null ? ROLE.ADMIN : ROLE.USER;
//     const user = await BotUser.findOne({
//         id: ctx.from.id,
//         bot: ctx.botObject._id,
//     });
//     if (!user) return next();
//     else {
//         await BotUser.updateOne(
//             {
//                 id: ctx.from.id,
//                 bot: ctx.botObject._id,
//             },
//             {
//                 $set: {
//                     'data.role': _role,
//                 },
//             }
//         );
//         ctx.session.role = _role;
//         await ctx.reply(`Successful updatedWorker. Role is ${_role}`);
//     }
// });
//
// InitScene.action('goToMenu', async (ctx) => {
//     await ctx.scene.enter('mainMenu');
// });
//
// InitScene.action('goToTemplateMenu', async (ctx) => {
//     await ctx.scene.enter('templateMenu');
// });


