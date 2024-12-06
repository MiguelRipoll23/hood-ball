import { EventType } from "../enums/event-type.js";
import { AuthenticationOptionsRequest } from "../interfaces/request/authentication-options.js";
import { RegistrationOptionsRequest } from "../interfaces/request/registration-options-request.js";
import { VerifyAuthenticationRequest } from "../interfaces/request/verify-authentication-request.js";
import { VerifyRegistrationRequest } from "../interfaces/request/verify-registration-request.js";
import { AuthenticationResponse } from "../interfaces/response/authentication_response.js";
import { GameController } from "../models/game-controller.js";
import { GameState } from "../models/game-state.js";
import { LocalEvent } from "../models/local-event.js";
import { ServerRegistration } from "../models/server-registration.js";
import { WebAuthnUtils } from "../utils/webauthn-utils.js";
import { APIService } from "./api-service.js";
import { EventProcessorService } from "./event-processor-service.js";

export class CredentialService {
  private gameState: GameState;
  private apiService: APIService;
  private eventProcessorService: EventProcessorService;

  private requestId: string;

  constructor(gameController: GameController) {
    this.gameState = gameController.getGameState();
    this.apiService = gameController.getApiService();
    this.eventProcessorService = gameController.getEventProcessorService();
    this.requestId = crypto.randomUUID();
  }

  public async showAutofillUI(): Promise<void> {
    if (
      typeof window.PublicKeyCredential === "undefined" ||
      typeof window.PublicKeyCredential.isConditionalMediationAvailable !==
        "function"
    ) {
      return;
    }

    const available =
      await PublicKeyCredential.isConditionalMediationAvailable();

    if (available) {
      const authenticationOptionsRequest: AuthenticationOptionsRequest = {
        requestId: this.requestId,
      };

      const authenticationOptions =
        await this.apiService.getAuthenticationOptions(
          authenticationOptionsRequest
        );

      const publicKey = {
        challenge: WebAuthnUtils.challengeToUint8Array(
          authenticationOptions.challenge
        ),
      };

      const credential = await navigator.credentials.get({
        mediation: "optional",
        publicKey,
      });

      if (credential === null) {
        console.log("User closed the autofill UI");
        return;
      }

      const verifyAuthenticationRequest: VerifyAuthenticationRequest = {
        requestId: this.requestId,
        authenticationResponse: WebAuthnUtils.serializeCredential(
          credential as PublicKeyCredential
        ),
      };

      const response = await this.apiService.verifyAuthenticationResponse(
        verifyAuthenticationRequest
      );

      this.handleAuthenticationResponse(response);
    }
  }

  public async getCredential(): Promise<void> {
    const authenticationOptionsRequest: AuthenticationOptionsRequest = {
      requestId: this.requestId,
    };

    const authenticationOptions =
      await this.apiService.getAuthenticationOptions(
        authenticationOptionsRequest
      );

    const publicKey = {
      challenge: WebAuthnUtils.challengeToUint8Array(
        authenticationOptions.challenge
      ),
    };

    const credential = await navigator.credentials.get({
      publicKey,
    });

    if (credential === null) {
      throw new Error("User canceled credential request");
    }

    const verifyAuthenticationRequest: VerifyAuthenticationRequest = {
      requestId: this.requestId,
      authenticationResponse: WebAuthnUtils.serializeCredential(
        credential as PublicKeyCredential
      ),
    };

    const response = await this.apiService.verifyAuthenticationResponse(
      verifyAuthenticationRequest
    );

    this.handleAuthenticationResponse(response);
  }

  public async createCredential(
    name: string,
    displayName: string
  ): Promise<void> {
    const registrationOptionsRequest: RegistrationOptionsRequest = {
      requestId: this.requestId,
      displayName: displayName,
    };

    const registrationOptions = await this.apiService.getRegistrationOptions(
      registrationOptionsRequest
    );

    const challenge = registrationOptions.challenge;
    const userId = registrationOptions.user.id;
    const pubKeyCredParams = registrationOptions.pubKeyCredParams;

    const publicKey = {
      ...registrationOptions,
      challenge: WebAuthnUtils.challengeToUint8Array(challenge),
      user: {
        id: new TextEncoder().encode(userId),
        name,
        displayName,
      },
      pubKeyCredParams: pubKeyCredParams.map((pkcp) => ({
        type: pkcp.type,
        alg: pkcp.alg,
      })),
    };

    const credential = await navigator.credentials.create({
      publicKey,
    });

    if (credential === null) {
      throw new Error("User canceled credential creation");
    }

    const verifyRegistrationRequest: VerifyRegistrationRequest = {
      requestId: this.requestId,
      displayName: name,
      registrationResponse: WebAuthnUtils.serializeCredential(
        credential as PublicKeyCredential
      ),
    };

    const response = await this.apiService.verifyRegistration(
      verifyRegistrationRequest
    );

    this.handleAuthenticationResponse(response);
  }

  private handleAuthenticationResponse(response: AuthenticationResponse): void {
    this.apiService.setAuthenticationToken(response.authentication_token);
    this.gameState.getGamePlayer().setName(response.display_name);

    this.gameState
      .getGameServer()
      .setServerRegistration(new ServerRegistration(response));

    const localEvent = new LocalEvent(EventType.ServerAuthenticated, null);
    this.eventProcessorService.addLocalEvent(localEvent);
  }
}
