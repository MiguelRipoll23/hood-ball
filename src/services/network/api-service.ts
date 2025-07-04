import {
  CONFIGURATION_BLOB_ENDPOINT,
  MATCHES_ADVERTISE_ENDPOINT,
  MATCHES_FIND_ENDPOINT,
  MATCHES_REMOVE_ENDPOINT,
  MESSAGES_ENDPOINT,
  VERSION_ENDPOINT,
  PLAYER_SCORES_PATH,
  REGISTRATION_OPTIONS_ENDPOINT,
  VERIFY_REGISTRATION_RESPONSE_ENDPOINT,
  VERIFY_AUTHENTICATION_RESPONSE_ENDPOINT,
  AUTHENTICATION_OPTIONS_ENDPOINT,
} from "../../constants/api-constants.js";
import type { FindMatchesResponse } from "../../interfaces/responses/find-matches-response.js";
import type { MessagesResponse } from "../../interfaces/responses/messages-response.js";
import type { AuthenticationResponse } from "../../interfaces/responses/authentication-response.js";
import type { VersionResponse } from "../../interfaces/responses/version-response.js";
import type { RankingResponse } from "../../interfaces/responses/ranking-response.js";
import type { AdvertiseMatchRequest } from "../../interfaces/requests/advertise-match-request.js";
import type { FindMatchesRequest } from "../../interfaces/requests/find-matches-request.js";
import type { SavePlayerScoresRequest } from "../../interfaces/requests/save-score-request.js";
import type { AuthenticationOptionsResponse } from "../../interfaces/responses/authentication-options-response.js";
import type { VerifyRegistrationRequest } from "../../interfaces/requests/verify-registration-request.js";
import type { RegistrationOptionsRequest } from "../../interfaces/requests/registration-options-request.js";
import type { AuthenticationOptionsRequest } from "../../interfaces/requests/authentication-options.js";
import type { VerifyAuthenticationRequest } from "../../interfaces/requests/verify-authentication-request.js";
import type { RegistrationOptionsResponse } from "../../interfaces/responses/registration-options-response.js";
import { CryptoService } from "../security/crypto-service.js";
import { APIUtils } from "../../utils/api-utils.js";
import { LoadingIndicatorService } from "../ui/loading-indicator-service.js";
import { container } from "../di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class APIService {
  private baseURL: string;
  private authenticationToken: string | null = null;
  private readonly cryptoService: CryptoService;
  private readonly loadingIndicatorService: LoadingIndicatorService;

  constructor() {
    this.baseURL = APIUtils.getBaseURL();
    this.cryptoService = container.get(CryptoService);
    this.loadingIndicatorService = container.get(LoadingIndicatorService);
  }

  private async fetchWithLoading(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    this.loadingIndicatorService.startLoading();

    try {
      return await fetch(input, init);
    } finally {
      this.loadingIndicatorService.stopLoading();
    }
  }

  public setAuthenticationToken(authenticationToken: string): void {
    this.authenticationToken = authenticationToken;
  }

  public async checkForUpdates(): Promise<boolean> {
    const response = await this.fetchWithLoading(
      this.baseURL + VERSION_ENDPOINT
    );

    if (response.ok === false) {
      throw new Error("Failed to fetch version");
    }

    const versionResponse: VersionResponse = await response.json();
    console.log("Version response", versionResponse);

    return false;
  }

  public async getRegistrationOptions(
    registrationOptionsRequest: RegistrationOptionsRequest
  ): Promise<RegistrationOptionsResponse> {
    const response = await this.fetchWithLoading(
      this.baseURL + REGISTRATION_OPTIONS_ENDPOINT,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationOptionsRequest),
    }
    );

    if (response.ok === false) {
      await APIUtils.throwAPIError(response);
    }

    const registrationOptions = await response.json();
    console.log("Registration options", registrationOptions);

    return registrationOptions;
  }

  public async verifyRegistration(
    verifyRegistrationRequest: VerifyRegistrationRequest
  ): Promise<AuthenticationResponse> {
    const response = await this.fetchWithLoading(
      this.baseURL + VERIFY_REGISTRATION_RESPONSE_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verifyRegistrationRequest),
      }
    );

    if (response.ok === false) {
      await APIUtils.throwAPIError(response);
    }

    const registrationResponse: AuthenticationResponse = await response.json();
    console.log("Registration response", registrationResponse);

    return registrationResponse;
  }

  public async getAuthenticationOptions(
    authenticationOptionsRequest: AuthenticationOptionsRequest
  ): Promise<AuthenticationOptionsResponse> {
    const response = await this.fetchWithLoading(
      this.baseURL + AUTHENTICATION_OPTIONS_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authenticationOptionsRequest),
      }
    );

    if (response.ok === false) {
      await APIUtils.throwAPIError(response);
    }

    const authenticationOptions = await response.json();
    console.log("Authentication options", authenticationOptions);

    return authenticationOptions;
  }

  public async verifyAuthenticationResponse(
    verifyAuthenticationRequest: VerifyAuthenticationRequest
  ): Promise<AuthenticationResponse> {
    const response = await this.fetchWithLoading(
      this.baseURL + VERIFY_AUTHENTICATION_RESPONSE_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verifyAuthenticationRequest),
      }
    );

    if (response.ok === false) {
      await APIUtils.throwAPIError(response);
    }

    const authenticationResponse: AuthenticationResponse =
      await response.json();

    console.log("Authentication response", authenticationResponse);

    return authenticationResponse;
  }

  public async getConfiguration(): Promise<ArrayBuffer> {
    if (this.authenticationToken === null) {
      throw new Error("Authentication token not found");
    }

    const response = await this.fetchWithLoading(this.baseURL + CONFIGURATION_BLOB_ENDPOINT, {
      headers: {
        Authorization: this.authenticationToken,
      },
    });

    if (response.ok === false) {
      throw new Error("Failed to fetch configuration");
    }

    return response.arrayBuffer();
  }

  public async getMessages(): Promise<MessagesResponse[]> {
    if (this.authenticationToken === null) {
      throw new Error("Authentication token not found");
    }

    const response = await this.fetchWithLoading(this.baseURL + MESSAGES_ENDPOINT, {
      headers: {
        Authorization: this.authenticationToken,
      },
    });

    if (response.ok === false) {
      throw new Error("Failed to fetch messages");
    }

    const messagesResponse: MessagesResponse[] = await response.json();
    console.log("Messages response", messagesResponse);

    return messagesResponse;
  }

  public async findMatches(
    findMatchesRequest: FindMatchesRequest
  ): Promise<FindMatchesResponse[]> {
    if (this.authenticationToken === null) {
      throw new Error("Authentication token not found");
    }

    const response = await this.fetchWithLoading(this.baseURL + MATCHES_FIND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: this.authenticationToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(findMatchesRequest),
    });

    if (response.ok === false) {
      throw new Error("Failed to find matches");
    }

    const findMatchResponse: FindMatchesResponse[] = await response.json();
    console.log("Find matches response", findMatchResponse);

    return findMatchResponse;
  }

  public async advertiseMatch(
    advertiseMatchRequest: AdvertiseMatchRequest
  ): Promise<void> {
    if (this.authenticationToken === null) {
      throw new Error("Authentication token not found");
    }

    const response = await this.fetchWithLoading(this.baseURL + MATCHES_ADVERTISE_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: this.authenticationToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(advertiseMatchRequest),
    });

    if (response.ok === false) {
      throw new Error("Failed to advertise match");
    }

    if (response.status !== 204) {
      throw new Error("Failed to advertise match");
    }

    console.log("Match advertised");
  }

  public async removeMatch(): Promise<void> {
    if (this.authenticationToken === null) {
      throw new Error("Authentication token not found");
    }

    const response = await this.fetchWithLoading(this.baseURL + MATCHES_REMOVE_ENDPOINT, {
      method: "DELETE",
      headers: {
        Authorization: this.authenticationToken,
      },
    });

    if (response.ok === false) {
      throw new Error("Failed to delete match");
    }

    if (response.status !== 204) {
      throw new Error("Failed to delete match");
    }

    console.log("Match deleted");
  }

  public async saveScore(
    saveScoreRequest: SavePlayerScoresRequest[]
  ): Promise<void> {
    if (this.authenticationToken === null) {
      throw new Error("Authentication token not found");
    }

    const encryptedRequest = await this.cryptoService.encryptRequest(
      JSON.stringify(saveScoreRequest)
    );

    const response = await this.fetchWithLoading(this.baseURL + PLAYER_SCORES_PATH, {
      method: "POST",
      headers: {
        Authorization: this.authenticationToken,
        "Content-Type": "application/json",
      },
      body: encryptedRequest,
    });

    if (response.ok === false) {
      throw new Error("Failed to save score");
    }

    if (response.status !== 204) {
      throw new Error("Failed to save score");
    }

    console.log("Score saved");
  }

  public async getRanking(): Promise<RankingResponse[]> {
    if (this.authenticationToken === null) {
      throw new Error("Authentication token not found");
    }

    const response = await this.fetchWithLoading(this.baseURL + PLAYER_SCORES_PATH, {
      headers: {
        Authorization: this.authenticationToken,
      },
    });

    if (response.ok === false) {
      throw new Error("Failed to fetch ranking");
    }

    const rankingResponse: RankingResponse[] = await response.json();
    console.log("Ranking response", rankingResponse);

    return rankingResponse;
  }
}
