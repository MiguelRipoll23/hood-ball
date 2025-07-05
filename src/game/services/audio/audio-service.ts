import { injectable } from "@needle-di/core";

@injectable()
export class AudioService {
  private enabled = false;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public toggle(): void {
    this.enabled = !this.enabled;
  }
}
