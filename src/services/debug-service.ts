import { ImGui, ImGuiImplWeb } from "@mori2003/jsimgui";
import type { GameController } from "../models/game-controller";
import { DebugWindow } from "../windows/debug-window";

export class DebugService {
  private debugCanvas: HTMLCanvasElement;
  private gameCanvas: HTMLCanvasElement;
  private initialized = false;
  private debugWindow: DebugWindow | null = null;
  private readonly knownEvents = new Set<string>();

  constructor(private gameController: GameController) {
    console.log(`${this.constructor.name} created`);
    this.debugCanvas = this.getDebugCanvas();
    this.gameCanvas = this.gameController.getCanvas();
    this.setCanvasSize();
    this.addEventListeners();
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async init(): Promise<void> {
    await ImGuiImplWeb.InitWebGL(this.debugCanvas);
    ImGui.SetNextWindowFocus();
    this.loadDebugWindow();
    this.initialized = true;
    console.log(`${this.constructor.name} initialized`);
  }

  public render(): void {
    if (!this.initialized) return;

    ImGuiImplWeb.BeginRenderWebGL();
    this.debugWindow?.render();
    ImGuiImplWeb.EndRenderWebGL();
  }

  private getDebugCanvas(): HTMLCanvasElement {
    const canvas = document.querySelector("#debug") as HTMLCanvasElement | null;
    if (!canvas) throw new Error("Debug canvas not found");
    return canvas;
  }

  private setCanvasSize(): void {
    this.debugCanvas.width = window.innerWidth;
    this.debugCanvas.height = window.innerHeight;
  }

  private addEventListeners(): void {
    window.addEventListener("resize", this.setCanvasSize.bind(this));

    this.preloadCommonEvents();
    this.patchAddEventListener();
  }

  private loadDebugWindow(): void {
    this.debugWindow = new DebugWindow(this.gameController);
  }

  private preloadCommonEvents(): void {
    const commonEvents = ["pointerdown", "pointerup", "pointermove"];
    commonEvents.forEach((eventType) => this.registerEvent(eventType));
  }

  private patchAddEventListener(): void {
    const originalAddEventListener = this.debugCanvas.addEventListener.bind(
      this.debugCanvas
    );

    this.debugCanvas.addEventListener = (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void => {
      this.registerEvent(type);

      // If the event is 'wheel' or touch events, and options is not explicitly false or { passive: false },
      // force passive to true for better scrolling performance.
      if (
        (type === "wheel" || type === "touchstart" || type === "touchmove") &&
        !(typeof options === "boolean" && options === false) &&
        !(typeof options === "object" && options.passive === false)
      ) {
        // Merge or override options to ensure passive: true
        let newOptions: AddEventListenerOptions;
        if (typeof options === "boolean") {
          // If options is just capture boolean, convert to object
          newOptions = { capture: options, passive: true };
        } else if (typeof options === "object") {
          newOptions = { ...options, passive: true };
        } else {
          newOptions = { passive: true };
        }
        originalAddEventListener(type, listener, newOptions);
      } else {
        // Use original options as-is
        originalAddEventListener(type, listener, options);
      }
    };
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
      const clonedEvent = new EventConstructor(event.type, event);
      this.gameCanvas.dispatchEvent(clonedEvent);
    } catch (error) {
      console.warn(`Could not forward event "${event.type}":`, error);
    }
  }
}
