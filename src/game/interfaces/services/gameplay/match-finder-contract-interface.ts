import type { FindMatchesResponse } from "../../responses/find-matches-response-interface.js";

export interface MatchFinderServiceContract {
  findMatches(): Promise<FindMatchesResponse>;
  createAndAdvertiseMatch(): Promise<void>;
  joinMatches(matches: FindMatchesResponse): Promise<void>;
  advertiseMatch(): Promise<void>;
}
