import { LoadingBackgroundObject } from "../../objects/backgrounds/loading-background-object.js";
import { ProgressBarObject } from "../../objects/common/progress-bar-object.js";

export interface LoadingObjects {
  background: LoadingBackgroundObject;
  progressBar: ProgressBarObject;
}

export class LoadingObjectFactory {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  public createObjects(): LoadingObjects {
    const background = new LoadingBackgroundObject(this.canvas);
    const progressBar = new ProgressBarObject(this.canvas);
    progressBar.setText("Loading world screen....");
    return { background, progressBar };
  }
}
