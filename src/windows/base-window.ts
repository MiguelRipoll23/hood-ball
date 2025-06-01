import { ImGui, ImVec2, type ImGuiWindowFlags } from "@mori2003/jsimgui";

export class BaseWindow {
  private readonly DISPLAY_SIZE_MARGIN = 25;

  protected opened = false;
  protected size?: ImVec2;
  protected flags?: ImGuiWindowFlags;
  private hasSetPosition = false;

  constructor(private title: string, size?: ImVec2, flags?: ImGuiWindowFlags) {
    console.log(`${this.constructor.name} created`);
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
      const displaySize = ImGui.GetIO().DisplaySize;
      const winWidth = this.size?.x ?? 200;
      const winHeight = this.size?.y ?? 200;

      const maxX = displaySize.x - winWidth - this.DISPLAY_SIZE_MARGIN;
      const maxY = displaySize.y - winHeight - this.DISPLAY_SIZE_MARGIN;
      const minX = this.DISPLAY_SIZE_MARGIN;
      const minY = this.DISPLAY_SIZE_MARGIN;

      const randX = minX + Math.random() * (maxX - minX);
      const randY = minY + Math.random() * (maxY - minY);

      ImGui.SetNextWindowPos(new ImVec2(randX, randY), ImGui.Cond.FirstUseEver);
      this.hasSetPosition = true;
    }

    const isOpenRef = [this.opened];

    const visible = ImGui.Begin(this.title, isOpenRef, this.flags);

    this.opened = isOpenRef[0]; // Track user closing the window

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
