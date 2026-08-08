import { MatchSession } from "../../models/match-session.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import { injectable, inject } from "@needle-di/core";
import type { TimerManagerServiceContract } from "../../../engine/interfaces/services/gameplay/timer-manager-service-interface.js";
import type { TimerServiceContract } from "../../../engine/interfaces/services/gameplay/timer-service-interface.js";
import { TimerManagerService } from "../../../engine/services/gameplay/timer-manager-service.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";

@injectable()
export class MatchSessionService {
  private match: MatchSession | null = null;
  private advertiseDebounceTimer: TimerServiceContract | null = null;
  private advertiseCallback: (() => void) | null = null;

  constructor(
    private readonly timerManagerService: TimerManagerServiceContract = inject(
      TimerManagerService
    )
  ) {}

  public getMatch(): MatchSession | null {
    return this.match;
  }

  public setMatch(match: MatchSession | null): void {
    if (match === null) {
      this.match = null;
      this.clearAdvertiseDebounce();
      EngineLogger.info("MatchSessionService", "Match removed from match session");
      return;
    }

    this.match = match;

    if (match.isHost()) {
      EngineLogger.info("MatchSessionService", "Match created in match session", match);
    } else {
      EngineLogger.info("MatchSessionService", "Match set in match session", match);
    }
  }

  public setMatchState(state: MatchStateType): void {
    if (this.match === null) {
      EngineLogger.warn("MatchSessionService", "Cannot set state, match is null");
      return;
    }

    this.match.setState(state);
    
    // Trigger debounced advertise after state change
    this.scheduleAdvertise();
  }

  public startMatch(): void {
    this.setMatchState(MatchStateType.InProgress);
  }

  public setAdvertiseCallback(callback: () => void): void {
    this.advertiseCallback = callback;
  }

  public triggerAdvertise(): void {
    // Trigger debounced advertise (for player changes, etc.)
    this.scheduleAdvertise();
  }

  private scheduleAdvertise(): void {
    if (this.advertiseCallback === null) {
      return;
    }

    // Clear existing timer to reset the debounce window
    this.clearAdvertiseDebounce();

    // Create new 100ms debounce timer
    this.advertiseDebounceTimer = this.timerManagerService.createTimer(
      0.1, // 100ms in seconds
      () => {
        const callback = this.advertiseCallback;
        this.advertiseDebounceTimer = null;
        try {
          if (callback !== null) {
            callback();
          }
        } catch (error) {
          EngineLogger.error("MatchSessionService", "Error in advertise callback:", error);
        }
      },
      true // autoStart
    );
  }

  private clearAdvertiseDebounce(): void {
    if (this.advertiseDebounceTimer !== null) {
      this.advertiseDebounceTimer.stop(false);
      this.timerManagerService.removeTimer(this.advertiseDebounceTimer);
      this.advertiseDebounceTimer = null;
    }
  }
}
