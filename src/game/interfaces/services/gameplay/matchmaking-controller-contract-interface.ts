import { InjectionToken } from "@needle-di/core";

export interface MatchmakingControllerContract {
  startMatchmaking(): Promise<void>;
}

export const MATCHMAKING_CONTROLLER_TOKEN =
  new InjectionToken<MatchmakingControllerContract>(
    "MatchmakingControllerContract"
  );
