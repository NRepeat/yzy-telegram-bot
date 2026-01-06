import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { BroadcastService } from '../services/broadcast.service';
import { MyContext, MySceneState } from '../types';

export const editWizard = new Scenes.WizardScene<MyContext>(
    'edit',
    async (ctx) => {
        ctx.reply('Please enter the new text for the broadcast:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        if (ctx.has(message('text'))) {
            const newText = (ctx.message as { text: string }).text;
            const broadcastId = ctx.scene.session.broadcastId!;
            const { broadcastService } = ctx.scene.state as MySceneState;
            await broadcastService!.editBroadcast(broadcastId, newText);
            await ctx.reply('Broadcast updated.');
            return ctx.scene.leave();
        }
        ctx.reply('Please enter a text message.');
    }
);