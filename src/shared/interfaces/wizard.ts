import { WizardContextWizard } from 'telegraf/scenes';
import { IContext, ISceneContextScene } from '.';

export type WizardCtx = IContext & {
  scene: ISceneContextScene<WizardCtx>;
  wizard: WizardContextWizard<WizardCtx>;
};
