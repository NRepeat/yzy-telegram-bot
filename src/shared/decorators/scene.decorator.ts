import { Scene } from 'nestjs-telegraf';

export function SceneContract(sceneId: string): ClassDecorator {
  return Scene(sceneId);
}
