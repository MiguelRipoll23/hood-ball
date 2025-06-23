import { Match } from "./match.js";
import { GamePlayer } from "./game-player.js";
import { GameServer } from "./game-server.js";
import { GameFrame } from "./game-frame.js";
import { GamePointer } from "./game-pointer.js";
import { DebugSettings } from "./debug-settings.js";
import { GameKeyboard } from "./game-keyboard.js";
import { GameGamepad } from "./game-gamepad.js";

export class GameState {
  private debugSettings: DebugSettings;

  private gameFrame: GameFrame;

  private gamePointer: GamePointer;
  private gameKeyboard: GameKeyboard;
  private gameGamepad: GameGamepad;

  private gameServer: GameServer;
  private gamePlayer: GamePlayer;
  private match: Match | null = null;

  constructor(private readonly canvas: HTMLCanvasElement, debugging: boolean) {
    this.debugSettings = new DebugSettings(debugging);
    this.gameFrame = new GameFrame();
    this.gamePointer = new GamePointer(this.canvas);
    this.gameKeyboard = new GameKeyboard();
    this.gameGamepad = new GameGamepad(this.gameFrame);
    this.gameServer = new GameServer();
    this.gamePlayer = new GamePlayer();
  }

  public isDebugging(): boolean {
    return this.debugSettings.isDebugging();
  }

  public getDebugSettings(): DebugSettings {
    return this.debugSettings;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
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

  public getGameServer(): GameServer {
    return this.gameServer;
  }

  public getGamePlayer(): GamePlayer {
    return this.gamePlayer;
  }

  public getMatch(): Match | null {
    return this.match;
  }

  public setMatch(match: Match | null): void {
    this.match = match;

    if (match === null) {
      return console.log("Match removed from game state");
    }

    if (match.isHost()) {
      console.log("Match created in game state", match);
    } else {
      console.log("Match set in game state", match);
    }
  }
}
