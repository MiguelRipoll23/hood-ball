export class BrowserService {
  constructor(private readonly canvas: HTMLCanvasElement) {
    this.addEventListeners();
  }

  private addEventListeners() {
    this.canvas.addEventListener(
      "fullscreenchange",
      this.removeEventListeners.bind(this),
    );

    this.canvas?.addEventListener("click", this.requestFullScreen.bind(this));
  }

  private requestFullScreen() {
    this.canvas.requestFullscreen().catch((error) => {
      alert(`Error: ${error.message}`);
    });
  }

  private removeEventListeners = () => {
    this.canvas.removeEventListener("click", this.requestFullScreen);
    this.canvas.removeEventListener(
      "fullscreenchange",
      this.removeEventListeners,
    );
  };
}
