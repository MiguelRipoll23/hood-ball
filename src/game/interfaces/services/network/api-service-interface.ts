import type { AdvertiseMatchRequest } from "../../requests/advertise-match-request.js";
import type { FindMatchesRequest } from "../../requests/find-matches-request.js";
import type { SaveUserScoresRequest } from "../../requests/save-score-request.js";
import type { RegistrationOptionsRequest } from "../../requests/registration-options-request.js";
import type { VerifyRegistrationRequest } from "../../requests/verify-registration-request.js";
import type { AuthenticationOptionsRequest } from "../../requests/authentication-options.js";
import type { VerifyAuthenticationRequest } from "../../requests/verify-authentication-request.js";
import type { RegistrationOptionsResponse } from "../../responses/registration-options-response.js";
import type { AuthenticationOptionsResponse } from "../../responses/authentication-options-response.js";
import type { AuthenticationResponse } from "../../responses/authentication-response.js";
import type { FindMatchesResponse } from "../../responses/find-matches-response.js";
import type { ServerMessagesResponse } from "../../responses/server-messages-response.js";
import type { RankingResponse } from "../../responses/ranking-response.js";

export interface IAPIService {
  setAuthenticationToken(authenticationToken: string): void;
  checkForUpdates(): Promise<boolean>;
  getRegistrationOptions(
    registrationOptionsRequest: RegistrationOptionsRequest
  ): Promise<RegistrationOptionsResponse>;
  verifyRegistration(
    verifyRegistrationRequest: VerifyRegistrationRequest
  ): Promise<AuthenticationResponse>;
  getAuthenticationOptions(
    authenticationOptionsRequest: AuthenticationOptionsRequest
  ): Promise<AuthenticationOptionsResponse>;
  verifyAuthenticationResponse(
    verifyAuthenticationRequest: VerifyAuthenticationRequest
  ): Promise<AuthenticationResponse>;
  getConfiguration(): Promise<ArrayBuffer>;
  getMessages(cursor?: number): Promise<ServerMessagesResponse>;
  findMatches(
    findMatchesRequest: FindMatchesRequest
  ): Promise<FindMatchesResponse>;
  advertiseMatch(advertiseMatchRequest: AdvertiseMatchRequest): Promise<void>;
  removeMatch(): Promise<void>;
  saveScore(saveScoreRequest: SaveUserScoresRequest[]): Promise<void>;
  getRanking(): Promise<RankingResponse[]>;
}
