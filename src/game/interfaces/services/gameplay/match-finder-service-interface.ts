import type { FindMatchesResponse } from "../../responses/find-matches-response.js";

export interface IMatchFinderService {
  findMatches(): Promise<FindMatchesResponse>;
  createAndAdvertiseMatch(): Promise<void>;
  joinMatches(matches: FindMatchesResponse): Promise<void>;
  advertiseMatch(): Promise<void>;
}
