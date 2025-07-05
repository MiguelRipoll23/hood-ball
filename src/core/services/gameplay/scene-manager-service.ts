import type { GameScene } from "../../../game/interfaces/scenes/game-scene.js";
import { SceneTransitionService } from "./scene-transition-service.js";
import type { ISceneManagerService } from "../../../game/interfaces/services/ui/scene-manager-service-interface.js";
import type { ISceneTransitionService } from "../../../game/interfaces/services/ui/scene-transition-service-interface.js";
import { container } from "../di-container.js";

export class SceneManagerService implements ISceneManagerService {
  private stack: GameScene[] = [];
  private currentScene: GameScene | null = null;
  private nextScene: GameScene | null = null;

  private transitionService: ISceneTransitionService;

  constructor() {
    this.transitionService = container.get(SceneTransitionService);
  }

  public getTransitionService(): ISceneTransitionService {
    return this.transitionService;
  }

  public setInitialScene(scene: GameScene): void {
    this.currentScene = scene;
    this.currentScene.setSceneManagerService(this);
    this.stack.push(scene);
  }

  public getPreviousScene(): GameScene | null {
    if (this.currentScene === null) {
      return null;
    }

    const index = this.stack.indexOf(this.currentScene);

    return this.stack[index - 1] || null;
  }

  public getCurrentScene(): GameScene | null {
    return this.currentScene;
  }

  public getNextScene(): GameScene | null {
    return this.nextScene;
  }

  public setCurrentScene(currentScene: GameScene): void {
    this.currentScene = currentScene;
  }

  public setNextScene(nextScene: GameScene | null): void {
    this.nextScene = nextScene;
    this.nextScene?.setSceneManagerService(this);

    if (nextScene === null) {
      return;
    }

    this.handleStack(nextScene);
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.transitionService.update(deltaTimeStamp);

    this.currentScene?.update(deltaTimeStamp);
    this.nextScene?.update(deltaTimeStamp);
  }

  public render(context: CanvasRenderingContext2D): void {
    this.currentScene?.render(context);
    this.nextScene?.render(context);
  }

  private handleStack(nextScene: GameScene): void {
    if (this.stack.includes(nextScene)) {
      // back to previous scene
      this.stack.pop();
    } else {
      // new scene
      this.stack.push(nextScene);
    }

    console.log("Scenes stack", this.stack);
  }
}
