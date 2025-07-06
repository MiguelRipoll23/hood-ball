import { injectable } from "@needle-di/core";
import { LIGHT_GREEN_COLOR } from "../../constants/colors-constants.js";

@injectable()
export class AudioService {
  private enabled = false;
  private button: HTMLButtonElement | null = null;

  constructor() {
    this.button = document.querySelector(
      "#audio-toggle-button"
    ) as HTMLButtonElement | null;
    this.button?.addEventListener("click", () => {
      this.toggle();
      this.updateButton();
    });
    this.updateButton();
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public enable(): void {
    this.enabled = true;
    this.updateButton();
  }

  public disable(): void {
    this.enabled = false;
    this.updateButton();
  }

  public toggle(): void {
    this.enabled = !this.enabled;
  }

  private updateButton(): void {
    if (!this.button) return;

    if (this.enabled) {
      this.button.classList.add("enabled");
      this.button.textContent = "\uD83D\uDD0A"; // speaker high volume
      this.button.style.background = LIGHT_GREEN_COLOR;
    } else {
      this.button.classList.remove("enabled");
      this.button.textContent = "\uD83D\uDD08"; // muted speaker
      this.button.style.background = "rgba(0, 0, 0, 0.5)";
    }
  }
}
