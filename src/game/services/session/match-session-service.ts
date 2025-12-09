import { MatchSession } from "../../models/match-session.js";
import { MatchStateType } from "../../enums/match-state-type.js";

export class MatchSessionService {
  private match: MatchSession | null = null;

  public getMatch(): MatchSession | null {
    return this.match;
  }

  public setMatch(match: MatchSession | null): void {
    if (match === null) {
      this.match = null;
      console.log("Match removed from match session");
      return;
    }

    this.match = match;

    if (match.isHost()) {
      console.log("Match created in match session", match);
    } else {
      console.log("Match set in match session", match);
    }
  }

  public setMatchState(state: MatchStateType): void {
    if (this.match === null) {
      console.warn("Cannot set state, match is null");
      return;
    }

    this.match.setState(state);
  }

  public startMatch(): void {
    this.setMatchState(MatchStateType.InProgress);
  }
}
