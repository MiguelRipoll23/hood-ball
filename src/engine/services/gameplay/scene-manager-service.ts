import type { GameScene } from "../../interfaces/scenes/game-scene.js";
import { SceneTransitionService } from "./scene-transition-service.js";
import type { SceneManagerServiceContract } from "../../../game/interfaces/services/ui/scene-manager-service-interface.js";
import type { SceneTransitionServiceContract } from "../../../game/interfaces/services/ui/scene-transition-service-interface.js";
import { container } from "../di-container.js";

export class SceneManagerService implements SceneManagerServiceContract {
  private stack: GameScene[] = [];
  private currentScene: GameScene | null = null;
  private nextScene: GameScene | null = null;

  private transitionService: SceneTransitionServiceContract;

  constructor() {
    this.transitionService = container.get(SceneTransitionService);
  }

  public getTransitionService(): SceneTransitionServiceContract {
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

  public getScenes(): GameScene[] {
    return [...this.stack];
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
      // Back to previous scene
      const nextSceneIndex = this.stack.indexOf(nextScene);
      // Remove all scenes after the target scene
      this.stack.splice(nextSceneIndex + 1);
    } else {
      // New scene
      this.stack.push(nextScene);
    }

    console.log("Scenes stack", this.stack);
  }
}
