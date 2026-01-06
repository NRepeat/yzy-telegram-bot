import { Scenes, Telegraf } from 'telegraf';
import { GroupService } from './services/group.service';
import { GroupSetService } from './services/groupSet.service';
import { BroadcastService } from './services/broadcast.service';
import { sendWizard } from './scenes/send.wizard';
import { editWizard } from './scenes/edit.wizard';

export class SceneManager {
  private stage: Scenes.Stage<any>;
  private groupService = new GroupService();
  private groupSetService = new GroupSetService();
  private broadcastService: BroadcastService;


  constructor(bot: Telegraf<any>) {
    this.broadcastService = new BroadcastService(bot);
    this.stage = new Scenes.Stage<any>([sendWizard, editWizard]);
  }

  public getStage() {
    return this.stage;
  }

  public registerScenes() {
    this.stage.scenes.get('send')?.enter((ctx: any) => {
      ctx.scene.state.broadcastService = this.broadcastService;
      ctx.scene.state.groupService = this.groupService;
      ctx.scene.state.groupSetService = this.groupSetService;
      return ctx.scene.reenter();
    });
    this.stage.scenes.get('edit')?.enter((ctx: any) => {
      ctx.scene.state.broadcastService = this.broadcastService;
      return ctx.scene.reenter();
    });
  }
}