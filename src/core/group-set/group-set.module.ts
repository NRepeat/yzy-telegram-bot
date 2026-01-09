import { Module } from '@nestjs/common';
import { GroupSetService } from './group-set.service';
import { GroupSetScene } from './group-set.scene';
import { ExtraModule } from '../extra/extra.module';
import { CreateGroupSetWizard } from './scenes/create-group-set.wizard';
import { ListGroupSetsScene } from './scenes/list-group-sets.scene';
import { ManageGroupSetScene } from './scenes/manage-group-set.scene';
import { AddGroupToSetWizard } from './scenes/add-group-to-set.wizard';
import { DeleteGroupSetWizard } from './scenes/delete-group-set.wizard';
import { PrismaService } from 'src/prisma/prisma.service';
import { TranslateService } from '../translate';
import { AddGroupsToSetWizard } from './scenes';
import { RemoveGroupsScene } from './scenes';

@Module({
  imports: [ExtraModule],
  providers: [
    GroupSetService,
    GroupSetScene,
    CreateGroupSetWizard,
    ListGroupSetsScene,
    ManageGroupSetScene,
    AddGroupToSetWizard,
    DeleteGroupSetWizard,
    PrismaService,
    TranslateService,
    AddGroupsToSetWizard,
    RemoveGroupsScene,
  ],
  exports: [
    GroupSetService,
    GroupSetScene,
    CreateGroupSetWizard,
    ListGroupSetsScene,
    ManageGroupSetScene,
    AddGroupToSetWizard,
    DeleteGroupSetWizard,
    AddGroupsToSetWizard,
    RemoveGroupsScene,
  ],
})
export class GroupSetModule {}
