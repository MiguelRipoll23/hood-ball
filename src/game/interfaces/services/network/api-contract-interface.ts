import type { AdvertiseMatchRequest } from "../../requests/advertise-match-request-interface.js";
import type { FindMatchesRequest } from "../../requests/find-matches-request-interface.js";
import type { SaveUserScoresRequest } from "../../requests/save-score-request-interface.js";
import type { RegistrationOptionsRequest } from "../../requests/registration-options-request-interface.js";
import type { VerifyRegistrationRequest } from "../../requests/verify-registration-request-interface.js";
import type { AuthenticationOptionsRequest } from "../../requests/authentication-options-interface.js";
import type { VerifyAuthenticationRequest } from "../../requests/verify-authentication-request-interface.js";
import type { RegistrationOptionsResponse } from "../../responses/registration-options-response-interface.js";
import type { AuthenticationOptionsResponse } from "../../responses/authentication-options-response-interface.js";
import type { AuthenticationResponse } from "../../responses/authentication-response-interface.js";
import type { FindMatchesResponse } from "../../responses/find-matches-response-interface.js";
import type { ServerMessagesResponse } from "../../responses/server-messages-response-interface.js";
import type { UserScoresResponse } from "../../responses/user-scores-response-interface.js";

export interface APIServiceContract {
  setAccessToken(accessToken: string): void;
  setRefreshToken(refreshToken: string | null): void;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  tryRestoreSession(): Promise<boolean>;
  clearSession(): void;
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
  getRanking(cursor?: string): Promise<UserScoresResponse>;
}
