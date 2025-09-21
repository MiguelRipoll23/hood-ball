import { LoadingBackgroundEntity } from "../../entities/backgrounds/loading-background-entity.js";
import { ProgressBarEntity } from "../../entities/common/progress-bar-entity.js";

export interface LoadingEntities {
  loadingBackgroundEntity: LoadingBackgroundEntity;
  progressBarEntity: ProgressBarEntity;
}

export class LoadingEntityFactory {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  public createEntities(): LoadingEntities {
    const loadingBackgroundEntity = new LoadingBackgroundEntity(this.canvas);
    const progressBarEntity = new ProgressBarEntity(this.canvas);
    progressBarEntity.setText("Loading world scene....");
    return { loadingBackgroundEntity, progressBarEntity };
  }
}
