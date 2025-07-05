import { LoadingBackgroundEntity } from "../../entities/backgrounds/loading-background-entity.js";
import { ProgressBarEntity } from "../../entities/common/progress-bar-entity.js";

export interface LoadingObjects {
  background: LoadingBackgroundEntity;
  progressBar: ProgressBarEntity;
}

export class LoadingEntityFactory {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  public createObjects(): LoadingObjects {
    const background = new LoadingBackgroundEntity(this.canvas);
    const progressBar = new ProgressBarEntity(this.canvas);
    progressBar.setText("Loading world scene....");
    return { background, progressBar };
  }
}
