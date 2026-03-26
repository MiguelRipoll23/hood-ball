import { ImGui, ImVec2, type ImGuiWindowFlags } from "@mori2003/jsimgui";

export class BaseWindow {
  private readonly DISPLAY_SIZE_MARGIN = 25;
  private readonly WINDOW_CASCADE_OFFSET = 20;
  private static nextWindowIndex = 0;

  protected title: string;
  protected size?: ImVec2;
  protected closeable: boolean;
  protected flags?: ImGuiWindowFlags;

  private opened = false;
  private hasSetPosition = false;

  constructor(
    title: string,
    size?: ImVec2,
    closeable = true,
    flags?: ImGuiWindowFlags
  ) {
    console.log(`${this.constructor.name} created`);
    this.title = title;
    this.closeable = closeable;
    this.size = size;
    this.flags = flags;
  }

  public isOpen(): boolean {
    return this.opened;
  }

  public open(): void {
    this.opened = true;
    this.hasSetPosition = false; // Reset on open to reposition
  }

  public close(): void {
    this.opened = false;
  }

  public toggle(): void {
    this.opened = !this.opened;
    if (this.opened) {
      this.hasSetPosition = false;
    }
  }

  public render(): void {
    if (!this.opened) return;

    if (this.size) {
      ImGui.SetNextWindowSize(this.size, ImGui.Cond.FirstUseEver);
    }

    if (!this.hasSetPosition) {
      const windowIndex = BaseWindow.nextWindowIndex;
      BaseWindow.nextWindowIndex += 1;

      const offset = windowIndex * this.WINDOW_CASCADE_OFFSET;
      const initialX = this.DISPLAY_SIZE_MARGIN + offset;
      const initialY = this.DISPLAY_SIZE_MARGIN + offset;

      ImGui.SetNextWindowPos(
        new ImVec2(initialX, initialY),
        ImGui.Cond.FirstUseEver
      );
      this.hasSetPosition = true;
    }

    const isOpenRef = [this.opened];
    const visible = this.closeable
      ? ImGui.Begin(this.title, isOpenRef, this.flags)
      : ImGui.Begin(this.title, undefined, this.flags);

    if (this.closeable) {
      this.opened = isOpenRef[0]; // Track user closing the window
    }

    if (visible) {
      this.renderContent();
    }

    ImGui.End();
  }

  protected renderContent(): void {
    ImGui.TextWrapped(
      "This is a base window. Override renderContent() to add custom content."
    );
  }
}
