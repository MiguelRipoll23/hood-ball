import { ImGui, ImGuiImplWeb } from "@mori2003/jsimgui";
import { DebugWindow } from "../windows/debug-window";
import { GameState } from "../models/game-state";
import { ServiceLocator } from "./service-locator";

export class DebugService {
  private debugCanvas: HTMLCanvasElement;
  private gameCanvas: HTMLCanvasElement;
  private context: WebGLRenderingContext | null = null;

  private initialized = false;
  private debugWindow: DebugWindow | null = null;
  private readonly knownEvents = new Set<string>();

  constructor(private gameState = ServiceLocator.get(GameState)) {
    console.log(`${this.constructor.name} created`);
    this.debugCanvas = this.getDebugCanvas();
    this.gameCanvas = this.gameState.getCanvas();
    this.setCanvasSize();
    this.addEventListeners();
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async init(): Promise<void> {
    await ImGuiImplWeb.InitWebGL(this.debugCanvas);
    this.setCanvasContext();
    ImGui.SetNextWindowFocus();
    this.loadDebugWindow();
    this.initialized = true;
    console.log(`${this.constructor.name} initialized`);
  }

  public render(): void {
    if (!this.initialized) return;

    if (this.gameState.isDebugging()) {
      ImGuiImplWeb.BeginRenderWebGL();
      this.debugWindow?.render();
      ImGuiImplWeb.EndRenderWebGL();
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
    this.debugCanvas.width = window.innerWidth;
    this.debugCanvas.height = window.innerHeight;
  }

  private clearCanvas(): void {
    this.context?.clearColor(0, 0, 0, 0);
    this.context?.clear(
      this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT
    );
  }

  private loadDebugWindow(): void {
    this.debugWindow = new DebugWindow(this.gameState);
  }

  private addEventListeners(): void {
    window.addEventListener("resize", this.setCanvasSize.bind(this));
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
}
