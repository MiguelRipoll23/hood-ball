import { GAME_VERSION } from "../constants/game-constants.js";
import { APIService } from "../services/api-service.js";
import { CryptoService } from "../services/crypto-service.js";
import { EventProcessorService } from "../services/event-processor-service.js";
import { IntervalService } from "../services/interval-service.js";
import { MatchmakingService } from "../services/matchmaking-service.js";
import { ObjectOrchestrator } from "../services/object-orchestrator-service.js";
import { ScreenTransitionService } from "../services/screen-transition-service.js";
import { TimerService } from "../services/timer-service.js";
import { WebRTCService } from "../services/webrtc-service.js";
import { WebSocketService } from "../services/websocket-service.js";
import { GameFrame } from "./game-frame.js";
import { GameKeyboard } from "./game-keyboard.js";
import { GamePointer } from "./game-pointer.js";
import { GameState } from "./game-state.js";
import { GameGamepad } from "./game-gamepad.js";
import { DebugService } from "../services/debug-service.js";
import { DebugSettings } from "./debug-settings.js";

export class GameController {
  private debugSettings: DebugSettings;
  private gameState: GameState;
  private gameFrame: GameFrame;
  private gamePointer: GamePointer;
  private gameKeyboard: GameKeyboard;
  private gameGamepad: GameGamepad;

  private timers: TimerService[] = [];
  private intervals: IntervalService[] = [];

  private readonly debugService: DebugService;
  private readonly transitionService: ScreenTransitionService;
  private readonly apiService: APIService;
  private readonly cryptoService: CryptoService;
  private readonly webSocketService: WebSocketService;
  private readonly matchmakingService: MatchmakingService;
  private webRTCService: WebRTCService;
  private objectOrchestrator: ObjectOrchestrator;
  private eventsProcessorService: EventProcessorService;

  constructor(private readonly canvas: HTMLCanvasElement, debugging: boolean) {
    this.debugSettings = new DebugSettings(debugging);
    this.gameState = new GameState();
    this.gameFrame = new GameFrame();
    this.gamePointer = new GamePointer(this.canvas);
    this.gameKeyboard = new GameKeyboard();
    this.gameGamepad = new GameGamepad(this.gameFrame);

    this.debugService = new DebugService(this);
    this.transitionService = new ScreenTransitionService(this.gameFrame);
    this.cryptoService = new CryptoService(this.gameState.getGameServer());
    this.apiService = new APIService(this);
    this.webRTCService = new WebRTCService(this);
    this.eventsProcessorService = new EventProcessorService(this);
    this.webSocketService = new WebSocketService(this);
    this.matchmakingService = new MatchmakingService(this);
    this.objectOrchestrator = new ObjectOrchestrator(this);
  }

  public isDebugging(): boolean {
    return this.getDebugSettings().isDebugging();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getVersion(): string {
    return GAME_VERSION;
  }

  public getDebugSettings(): DebugSettings {
    return this.debugSettings;
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public getGameFrame(): GameFrame {
    return this.gameFrame;
  }

  public getGamePointer(): GamePointer {
    return this.gamePointer;
  }

  public getGameKeyboard(): GameKeyboard {
    return this.gameKeyboard;
  }

  public getGameGamepad(): GameGamepad {
    return this.gameGamepad;
  }

  public getTimers(): TimerService[] {
    return this.timers;
  }

  public addTimer(
    seconds: number,
    callback: () => void,
    start = true
  ): TimerService {
    const timerService = new TimerService(seconds, callback, start);
    this.timers.push(timerService);

    console.log("Added timer, updated timers count", this.timers.length);

    return timerService;
  }

  public removeTimer(timer: TimerService): void {
    const index = this.timers.indexOf(timer);

    if (index !== -1) {
      this.timers.splice(index, 1);
    }

    console.log("Removed timer, updated timers count", this.timers.length);
  }

  public getIntervals(): IntervalService[] {
    return this.intervals;
  }

  public addInterval(
    seconds: number,
    callback: () => void,
    start = true
  ): IntervalService {
    const intervalService = new IntervalService(seconds, callback, start);
    this.intervals.push(intervalService);

    console.log(
      "Added interval, updated intervals count",
      this.intervals.length
    );

    return intervalService;
  }

  public removeInterval(interval: IntervalService): void {
    const index = this.intervals.indexOf(interval);

    if (index !== -1) {
      this.intervals.splice(index, 1);
    }

    console.log(
      "Removed interval, updated intervals count",
      this.intervals.length
    );
  }

  public getDebugService(): DebugService {
    return this.debugService;
  }

  public getTransitionService(): ScreenTransitionService {
    return this.transitionService;
  }

  public getAPIService(): APIService {
    return this.apiService;
  }

  public getCryptoService(): CryptoService {
    return this.cryptoService;
  }

  public getWebSocketService(): WebSocketService {
    return this.webSocketService;
  }

  public getMatchmakingService(): MatchmakingService {
    return this.matchmakingService;
  }

  public getWebRTCService(): WebRTCService {
    return this.webRTCService;
  }

  public getObjectOrchestrator(): ObjectOrchestrator {
    return this.objectOrchestrator;
  }

  public getEventProcessorService(): EventProcessorService {
    return this.eventsProcessorService;
  }
}
