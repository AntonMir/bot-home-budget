declare module 'telegraf-ratelimit' {
    import { Context, Middleware } from 'telegraf';
    import { Update } from 'telegraf/types';

    interface LimitConfig {
        window: number;
        limit: number;
        onLimitExceeded: (ctx: Context<Update>) => void;
    }
    export default function (config: LimitConfig): Middleware<Context<Update>>;
}
