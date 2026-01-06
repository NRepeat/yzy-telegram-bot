import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { BroadcastService } from '../services/broadcast.service';

export const editWizard = new Scenes.WizardScene(
    'edit',
    async (ctx: any) => {
        ctx.reply('Please enter the new text for the broadcast:');
        return ctx.wizard.next();
    },
    async (ctx: any) => {
        if (ctx.has(message('text'))) {
            const newText = ctx.message.text;
            const broadcastId = ctx.scene.session.broadcastId;
            const broadcastService = ctx.scene.state.broadcastService as BroadcastService;
            await broadcastService.editBroadcast(broadcastId, newText);
            await ctx.reply('Broadcast updated.');
            return ctx.scene.leave();
        }
        ctx.reply('Please enter a text message.');
    }
);