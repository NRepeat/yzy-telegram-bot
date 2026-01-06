import { Scenes, Telegraf } from 'telegraf';
import { GroupService } from './services/group.service';
import { GroupSetService } from './services/groupSet.service';
import { BroadcastService } from './services/broadcast.service';
import { sendWizard } from './scenes/send.wizard';
import { editWizard } from './scenes/edit.wizard';
import { MyContext, MySceneState } from './types';

export class SceneManager {
  private stage: Scenes.Stage<MyContext>;
  private groupService = new GroupService();
  private groupSetService = new GroupSetService();
  private broadcastService: BroadcastService;


  constructor(bot: Telegraf<MyContext>) {
    this.broadcastService = new BroadcastService(bot);
    this.stage = new Scenes.Stage<MyContext>([sendWizard, editWizard]);
  }

  public getStage() {
    return this.stage;
  }

  public registerScenes() {
    this.stage.scenes.get('send')?.enter((ctx: MyContext) => {
      (ctx.scene.state as MySceneState).broadcastService = this.broadcastService;
      (ctx.scene.state as MySceneState).groupService = this.groupService;
      (ctx.scene.state as MySceneState).groupSetService = this.groupSetService;
      return ctx.scene.reenter();
    });
    this.stage.scenes.get('edit')?.enter((ctx: MyContext) => {
      (ctx.scene.state as MySceneState).broadcastService = this.broadcastService;
      return ctx.scene.reenter();
    });
  }
}