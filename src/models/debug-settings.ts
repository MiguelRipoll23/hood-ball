export class DebugSettings {
  private debugging: boolean;

  private tappableAreaVisible: boolean = true;
  private hitboxVisible: boolean = true;
  private gizmosVisible: boolean = true;

  constructor(debugging: boolean) {
    this.debugging = debugging;
  }

  public isDebugging(): boolean {
    return this.debugging;
  }

  public setDebugging(value: boolean): void {
    this.debugging = value;

    if (this.debugging) {
      console.info(
        "%cDebug mode on",
        "color: #b6ff35; font-size: 20px; font-weight: bold"
      );
    } else {
      console.info(
        "%cDebug mode off",
        "color: #ff5733; font-size: 20px; font-weight: bold"
      );
    }
  }

  public areTappableAreasVisible(): boolean {
    return this.tappableAreaVisible;
  }

  public setTappableAreasVisibility(value: boolean): void {
    this.tappableAreaVisible = value;
    console.log(`Tappable areas visibility set to: ${value}`);
  }

  public areHitboxesVisible(): boolean {
    return this.hitboxVisible;
  }

  public setHitboxesVisibility(value: boolean): void {
    this.hitboxVisible = value;
    console.log(`Hitboxes visibility set to: ${value}`);
  }

  public areGizmosVisible(): boolean {
    return this.gizmosVisible;
  }

  public setGizmosVisibility(value: boolean): void {
    this.gizmosVisible = value;
    console.log(`Gizmos visibility set to: ${value}`);
  }
}
