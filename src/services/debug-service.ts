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
    this.loadDebugWindow();
  }

  public async init(): Promise<void> {
    await ImGuiImplWeb.InitWebGL(this.debugCanvas);
    ImGui.SetNextWindowFocus();
    this.initialized = true;
    console.log(`${this.constructor.name} initialized`);
  }

  public render(): void {
    if (!this.initialized) return;

    ImGuiImplWeb.BeginRenderWebGL();
    this.debugWindow?.render();
    ImGuiImplWeb.EndRenderWebGL();
  }

  // --- Setup Methods ---

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

  // --- Event Forwarding ---

  private preloadCommonEvents(): void {
    const commonEvents = [
      "pointerdown",
      "pointerup",
      "pointermove",
      "click",
      "keydown",
      "keyup",
      "keypress",
      "wheel",
      "mousedown",
      "mouseup",
      "mousemove",
      "touchstart",
      "touchend",
      "touchmove",
      "drag",
      "drop",
      "submit",
      "change",
      "input",
    ];
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
      originalAddEventListener(type, listener, options);
    };
  }

  private registerEvent(type: string): void {
    if (this.knownEvents.has(type)) return;
    this.knownEvents.add(type);
    this.debugCanvas.addEventListener(
      type,
      this.cloneAndDispatchEvent.bind(this)
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
