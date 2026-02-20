import {
  AUTHENTICATION_OPTIONS_ENDPOINT,
  AUTHENTICATION_REFRESH_ENDPOINT,
  CONFIGURATION_BLOB_ENDPOINT,
  MATCHES_ADVERTISE_ENDPOINT,
  MATCHES_FIND_ENDPOINT,
  MATCHES_REMOVE_ENDPOINT,
  MESSAGES_ENDPOINT,
  REGISTRATION_OPTIONS_ENDPOINT,
  USER_SCORES_PATH,
  VERIFY_AUTHENTICATION_RESPONSE_ENDPOINT,
  VERIFY_REGISTRATION_RESPONSE_ENDPOINT,
  VERSION_ENDPOINT,
} from "../../constants/api-constants.js";
import type { FindMatchesResponse } from "../../interfaces/responses/find-matches-response-interface.js";
import type { ServerMessagesResponse } from "../../interfaces/responses/server-messages-response-interface.js";
import type { AuthenticationResponse } from "../../interfaces/responses/authentication-response-interface.js";
import type { VersionResponse } from "../../interfaces/responses/version-response-interface.js";
import type { UserScoresResponse } from "../../interfaces/responses/user-scores-response-interface.js";
import type { AdvertiseMatchRequest } from "../../interfaces/requests/advertise-match-request-interface.js";
import type { FindMatchesRequest } from "../../interfaces/requests/find-matches-request-interface.js";
import type { SaveUserScoresRequest } from "../../interfaces/requests/save-score-request-interface.js";
import type { AuthenticationOptionsResponse } from "../../interfaces/responses/authentication-options-response-interface.js";
import type { VerifyRegistrationRequest } from "../../interfaces/requests/verify-registration-request-interface.js";
import type { RegistrationOptionsRequest } from "../../interfaces/requests/registration-options-request-interface.js";
import type { AuthenticationOptionsRequest } from "../../interfaces/requests/authentication-options-interface.js";
import type { VerifyAuthenticationRequest } from "../../interfaces/requests/verify-authentication-request-interface.js";
import type { RegistrationOptionsResponse } from "../../interfaces/responses/registration-options-response-interface.js";
import { CryptoService } from "../security/crypto-service.js";
import { APIUtils } from "../../utils/api-utils.js";
import { LoadingIndicatorService } from "../ui/loading-indicator-service.js";
import { injectable, inject } from "@needle-di/core";

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_TOKEN_STORAGE_KEY = "hoodBall.refreshToken";

@injectable()
export class APIService {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor(
    private readonly cryptoService: CryptoService = inject(CryptoService),
    private readonly loadingIndicatorService: LoadingIndicatorService = inject(
      LoadingIndicatorService
    )
  ) {
    this.baseURL = APIUtils.getBaseURL();
    this.refreshToken = this.readPersistedRefreshToken();
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

  private readPersistedRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  public setAccessToken(accessToken: string): void {
    this.accessToken = accessToken;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public setRefreshToken(refreshToken: string | null): void {
    this.refreshToken = refreshToken;

    try {
      if (refreshToken === null) {
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      } else {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
      }
    } catch (error) {
      console.warn("Failed to persist refresh token", error);
    }
  }

  public getRefreshToken(): string | null {
    return this.refreshToken;
  }

  public clearSession(): void {
    this.accessToken = null;
    this.setRefreshToken(null);
  }

  public async tryRestoreSession(): Promise<boolean> {
    if (this.accessToken !== null) {
      return true;
    }

    if (this.refreshToken === null) {
      return false;
    }

    try {
      await this.refreshAccessToken();
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (this.refreshToken === null) {
      throw new Error("Refresh token not found");
    }

    if (this.refreshPromise !== null) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const response = await this.fetchWithLoading(
        this.baseURL + AUTHENTICATION_REFRESH_ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refreshToken: this.refreshToken,
          }),
        }
      );

      if (!response.ok) {
        this.clearSession();
        throw new Error("Session expired. Please sign in again.");
      }

      const refreshResponse: RefreshResponse = await response.json();
      this.setAccessToken(refreshResponse.accessToken);
      this.setRefreshToken(refreshResponse.refreshToken);
    })();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  public async fetchWithAuthentication(
    input: RequestInfo | URL,
    init: RequestInit = {},
    retried = false
  ): Promise<Response> {
    if (this.accessToken === null) {
      await this.tryRestoreSession();
    }

    if (this.accessToken === null) {
      throw new Error("Authentication required");
    }

    const headers = new Headers(init.headers);
    headers.set("Authorization", this.accessToken);

    const response = await this.fetchWithLoading(input, {
      ...init,
      headers,
    });

    if (response.status === 401 && !retried) {
      await this.refreshAccessToken();
      return this.fetchWithAuthentication(input, init, true);
    }

    if (response.status === 401) {
      this.clearSession();
      throw new Error("Session expired. Please sign in again.");
    }

    return response;
  }

  public hasRole(role: string): boolean {
    if (!this.accessToken) {
      return false;
    }

    try {
      const payload = this.accessToken.split(".")[1];
      if (!payload) return false;
      const decoded = JSON.parse(atob(payload));

      if (Array.isArray(decoded.roles)) {
        return decoded.roles.includes(role);
      }
      return false;
    } catch (e) {
      console.error("Failed to parse token roles", e);
      return false;
    }
  }

  public async checkForUpdates(): Promise<boolean> {
    const response = await this.fetchWithLoading(this.baseURL + VERSION_ENDPOINT);

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

    return response.json();
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

    return response.json();
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

    return response.json();
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

    return response.json();
  }

  public async getConfiguration(): Promise<ArrayBuffer> {
    const response = await this.fetchWithAuthentication(
      this.baseURL + CONFIGURATION_BLOB_ENDPOINT
    );

    if (response.ok === false) {
      throw new Error("Failed to fetch configuration");
    }

    return response.arrayBuffer();
  }

  public async getMessages(cursor?: number): Promise<ServerMessagesResponse> {
    const url =
      this.baseURL +
      MESSAGES_ENDPOINT +
      (cursor !== undefined ? `?cursor=${cursor}` : "");

    const response = await this.fetchWithAuthentication(url);

    if (response.ok === false) {
      throw new Error("Failed to fetch messages");
    }

    return response.json();
  }

  public async findMatches(
    findMatchesRequest: FindMatchesRequest
  ): Promise<FindMatchesResponse> {
    const response = await this.fetchWithAuthentication(
      this.baseURL + MATCHES_FIND_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(findMatchesRequest),
      }
    );

    if (response.ok === false) {
      throw new Error("Failed to find matches");
    }

    return response.json();
  }

  public async advertiseMatch(
    advertiseMatchRequest: AdvertiseMatchRequest
  ): Promise<void> {
    const response = await this.fetchWithAuthentication(
      this.baseURL + MATCHES_ADVERTISE_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(advertiseMatchRequest),
      }
    );

    if (response.status !== 204) {
      throw new Error("Failed to advertise match");
    }
  }

  public async removeMatch(): Promise<void> {
    const response = await this.fetchWithAuthentication(
      this.baseURL + MATCHES_REMOVE_ENDPOINT,
      {
        method: "DELETE",
      }
    );

    if (response.status !== 204) {
      throw new Error("Failed to delete match");
    }
  }

  public async saveScore(saveScoreRequest: SaveUserScoresRequest[]): Promise<void> {
    const encryptedRequest = await this.cryptoService.encryptRequest(
      JSON.stringify(saveScoreRequest)
    );

    const response = await this.fetchWithAuthentication(
      this.baseURL + USER_SCORES_PATH,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: encryptedRequest,
      }
    );

    if (response.status !== 204) {
      throw new Error("Failed to save score");
    }
  }

  public async getRanking(cursor?: string): Promise<UserScoresResponse> {
    const url =
      this.baseURL +
      USER_SCORES_PATH +
      (cursor !== undefined ? `?cursor=${cursor}` : "");

    const response = await this.fetchWithAuthentication(url);

    if (response.ok === false) {
      throw new Error("Failed to fetch ranking");
    }

    return response.json();
  }
}
