import { ImGui, ImGuiImplWeb, ImVec2 } from "@mori2003/jsimgui";
import { GameState } from "../../models/game-state.js";
import { injectable, inject } from "@needle-di/core";
import { BaseWindow } from "../../debug/base-window.js";

@injectable()
export class DebugService {
  private static readonly MAX_ERROR_MESSAGES = 200;
  private static consolePatched = false;

  private debugCanvas: HTMLCanvasElement;
  private gameCanvas: HTMLCanvasElement;
  private context: WebGLRenderingContext | null = null;

  private initialized = false;
  private windows: BaseWindow[] = [];
  private readonly knownEvents = new Set<string>();

  private errorMessages: string[] = [];

  constructor(private gameState: GameState = inject(GameState)) {
    console.log(`${this.constructor.name} created`);
    this.debugCanvas = this.getDebugCanvas();
    this.gameCanvas = this.gameState.getCanvas();
    this.setCanvasSize();
    this.addEventListeners();
    this.patchConsoleError();
  }

  public registerWindow(window: BaseWindow): void {
    this.windows.push(window);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async init(): Promise<void> {
    await ImGuiImplWeb.Init({ canvas: this.debugCanvas });
    this.setCanvasContext();
    ImGui.SetNextWindowFocus();
    this.initialized = true;
    console.log(`${this.constructor.name} initialized`);
  }

  public render(): void {
    if (!this.initialized) return;

    if (this.gameState.isDebugging()) {
      ImGuiImplWeb.BeginRender();
      this.windows.forEach((w) => w.render());
      this.renderErrorMessages();
      ImGuiImplWeb.EndRender();
    } else {
      this.clearCanvas();
    }
  }

  private getDebugCanvas(): HTMLCanvasElement {
    const canvas = document.querySelector("#debug") as HTMLCanvasElement | null;
    if (!canvas) throw new Error("Debug canvas not found");
    return canvas;
  }

  private setCanvasContext(): void {
    this.context =
      this.debugCanvas.getContext("webgl2") ||
      this.debugCanvas.getContext("webgl");
  }

  private setCanvasSize(): void {
    this.debugCanvas.width = globalThis.innerWidth;
    this.debugCanvas.height = globalThis.innerHeight;
  }

  private clearCanvas(): void {
    if (!this.context) return;
    const ctx = this.context;
    ctx.clearColor(0, 0, 0, 0);
    ctx.clearDepth(1.0);
    ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
  }

  private addEventListeners(): void {
    globalThis.addEventListener("resize", this.setCanvasSize.bind(this));
    this.preloadCommonEvents();
    this.patchCanvasAddEventListener();
  }

  private preloadCommonEvents(): void {
    ["pointerdown", "pointerup", "pointermove"].forEach((type) =>
      this.registerEvent(type)
    );
  }

  private registerEvent(type: string): void {
    if (this.knownEvents.has(type)) return;
    this.knownEvents.add(type);

    const isScrollBlocking =
      type === "wheel" || type === "touchstart" || type === "touchmove";

    this.debugCanvas.addEventListener(
      type,
      this.cloneAndDispatchEvent.bind(this),
      isScrollBlocking ? { passive: true } : undefined
    );
  }

  private cloneAndDispatchEvent(event: Event): void {
    try {
      const EventConstructor = event.constructor as {
        new (type: string, eventInitDict?: any): Event;
      };
      const cloned = new EventConstructor(event.type, event);
      this.gameCanvas.dispatchEvent(cloned);
    } catch (error) {
      console.warn(`Could not forward event "${event.type}":`, error);
    }
  }

  private patchCanvasAddEventListener(): void {
    const originalAdd = this.debugCanvas.addEventListener.bind(
      this.debugCanvas
    );

    this.debugCanvas.addEventListener = (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void => {
      this.registerEvent(type);

      const needsPassive =
        (type === "wheel" || type === "touchstart" || type === "touchmove") &&
        !(
          (typeof options === "boolean" && options === false) ||
          (typeof options === "object" && options.passive === false)
        );

      const finalOptions = needsPassive
        ? typeof options === "boolean"
          ? { capture: options, passive: true }
          : { ...options, passive: true }
        : options;

      originalAdd(type, listener, finalOptions);
    };
  }

  /**
   * Patches console.error to capture logs for the debug overlay.
   *
   * NOTE: Initialize DebugService AFTER any external error monitoring tools (like Sentry)
   * to ensure they are correctly chained.
   */
  private patchConsoleError(): void {
    if (DebugService.consolePatched) return;

    const originalConsoleError = console.error;
    console.error = (...args: unknown[]): void => {
      originalConsoleError.apply(console, args);
      this.handleConsoleError(args);
    };
    DebugService.consolePatched = true;
  }

  private handleConsoleError(args: unknown[]): void {
    if (!this.gameState.isDebugging()) return;

    const parts = args.map((arg) => {
      if (typeof arg === "string") return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    });

    if (this.errorMessages.length >= DebugService.MAX_ERROR_MESSAGES) {
      this.errorMessages.shift();
    }
    this.errorMessages.push(parts.join(" "));
  }

  private static readonly ERROR_COLOR = 0xff0000ff;

  private renderErrorMessages(): void {
    if (this.errorMessages.length === 0) return;

    const io = ImGui.GetIO();
    ImGui.SetNextWindowBgAlpha(0.35);
    ImGui.SetNextWindowPos(
      new ImVec2(10, io.DisplaySize.y - 10),
      ImGui.Cond.Always,
      new ImVec2(0, 1)
    );

    // Use the full width so wrapped text is readable on small screens
    ImGui.SetNextWindowSize(
      new ImVec2(io.DisplaySize.x - 20, 0),
      ImGui.Cond.Always
    );

    const flags =
      ImGui.WindowFlags.NoDecoration |
      ImGui.WindowFlags.NoMove |
      ImGui.WindowFlags.AlwaysAutoResize;

    ImGui.PushStyleColor(ImGui.Col.Text, DebugService.ERROR_COLOR);

    if (ImGui.Begin("ErrorOverlay", undefined, flags)) {
      this.errorMessages.forEach((msg) => {
        ImGui.TextWrapped(msg);
      });
    }
    ImGui.End();

    ImGui.PopStyleColor();
  }
}
