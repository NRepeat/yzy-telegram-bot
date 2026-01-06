import { Scenes, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { GroupService } from '../services/group.service';
import { GroupSetService } from '../services/groupSet.service';
import { BroadcastService } from '../services/broadcast.service';

const showMenu = async (ctx: any) => {
    const groupService = ctx.scene.state.groupService as GroupService;
    const groupSetService = ctx.scene.state.groupSetService as GroupSetService;

    const groups = await groupService.getGroups();
    const groupSets = await groupSetService.getGroupSets();

    ctx.scene.session.selected = ctx.scene.session.selected || new Set();
    ctx.scene.session.activeSets = ctx.scene.session.activeSets || new Set();

    const groupButtons = groups.map((group) => {
      const isSelected = ctx.scene.session.selected.has(group.chat_id.toString());
      return Markup.button.callback(
        `${isSelected ? '✅' : ''} ${group.title}`,
        `toggle_group_${group.chat_id}`
      );
    });

    const groupSetButtons = groupSets.map((set) => {
      const isActive = ctx.scene.session.activeSets.has(set.id);
      return Markup.button.callback(
        `${isActive ? '✅' : ''} ${set.name}`,
        `toggle_set_${set.id}`
      );
    });

    const keyboard = Markup.inlineKeyboard([
      ...groupSetButtons.map(b => [b]),
      ...groupButtons.map(b => [b]),
      [
        Markup.button.callback('Send', 'send_broadcast'),
        Markup.button.callback('Save as group set', 'save_set'),
        Markup.button.callback('Cancel', 'cancel'),
      ],
    ]);
    
    if(ctx.callbackQuery) {
        await ctx.editMessageText('Select groups and group sets to broadcast to:', keyboard);
    } else {
        await ctx.reply('Select groups and group sets to broadcast to:', keyboard);
    }
};

const handleMenu = new Scenes.WizardScene(
    'send',
    // Step 1: Show menu
    async (ctx: any) => {
        await showMenu(ctx);
        return ctx.wizard.next();
    },
    // Step 2: Handle button clicks
    async (ctx: any) => {
        if(!ctx.callbackQuery) {
            return;
        }
        const data = ctx.callbackQuery.data;

        if (data.startsWith('toggle_group_')) {
            const chatId = data.replace('toggle_group_', '');
            if (ctx.scene.session.selected.has(chatId)) {
                ctx.scene.session.selected.delete(chatId);
            } else {
                ctx.scene.session.selected.add(chatId);
            }
            await showMenu(ctx);
            return;
        }

        if (data.startsWith('toggle_set_')) {
            const setId = parseInt(data.replace('toggle_set_', ''));
            const groupSetService = ctx.scene.state.groupSetService as GroupSetService;
            const groupSet = await groupSetService.getGroupSets().then(sets => sets.find(s => s.id === setId));
            if (groupSet) {
                if (ctx.scene.session.activeSets.has(setId)) {
                    ctx.scene.session.activeSets.delete(setId);
                    groupSet.items.forEach(item => ctx.scene.session.selected.delete(item.chat_id.toString()));
                } else {
                    ctx.scene.session.activeSets.add(setId);
                    groupSet.items.forEach(item => ctx.scene.session.selected.add(item.chat_id.toString()));
                }
            }
            await showMenu(ctx);
            return;
        }

        if (data === 'send_broadcast') {
            ctx.reply('Please enter the message to broadcast:');
            return ctx.wizard.next();
        }

        if (data === 'cancel') {
            await ctx.reply('Broadcast cancelled.');
            return ctx.scene.leave();
        }

        if (data === 'save_set') {
            ctx.reply('Please enter a name for the group set:');
            return ctx.wizard.next();
        }
    },
    // Step 3: Ask for message and send
    async (ctx: any) => {
        if (ctx.has(message('text'))) {
            ctx.scene.session.text = ctx.message.text;
            await ctx.reply(`Message "${ctx.scene.session.text}" will be sent to selected groups.`);
            const broadcastService = ctx.scene.state.broadcastService as BroadcastService;
            const selectedChatIds = Array.from(ctx.scene.session.selected).map(id => BigInt(id as string));
            await broadcastService.createBroadcast(ctx.scene.session.text, selectedChatIds);
            return ctx.scene.leave();
        }
        ctx.reply('Please enter a text message.');
    },
    // Step 4: Ask for group set name
    async (ctx: any) => {
        if(ctx.has(message('text'))){
            const groupSetService = ctx.scene.state.groupSetService as GroupSetService;
            const selectedChatIds = Array.from(ctx.scene.session.selected).map(id => BigInt(id as string));
            await groupSetService.createGroupSet(ctx.message.text, selectedChatIds);
            await ctx.reply('Group set saved.');
            ctx.wizard.selectStep(0);
            return showMenu(ctx);
        }
        ctx.reply('Please enter a name for the group set.');
    }
);

export const sendWizard = handleMenu;