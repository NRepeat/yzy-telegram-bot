import { SceneEnter } from 'nestjs-telegraf';
import { SceneContract } from 'src/shared/decorators';
import { ExtraService } from '../extra/extra.service';
import type { IContext } from 'src/shared/interfaces';
import { GroupService } from './group.service';

@SceneContract('scenes.groups')
export class GroupScene {
  constructor(
    private readonly extra: ExtraService,
    private readonly groupSetService: GroupService,
  ) {}

  @SceneEnter()
  enter(ctx: IContext) {
    // Initialize session state for groupSet if it doesn't exist
    if (!ctx.session.groupSet) {
      ctx.session.groupSet = {
        selectedGroupSetId: undefined,
        selectedChatIds: [],
      };
    }
  }

  // TODO: Add more action contracts for editing, deleting, adding groups, etc.
}
