import { EventType } from "../enums/event-type.js";
import { AuthenticationOptionsRequest } from "../interfaces/request/authentication-options.js";
import { RegistrationOptionsRequest } from "../interfaces/request/registration-options-request.js";
import { VerifyAuthenticationRequest } from "../interfaces/request/verify-authentication-request.js";
import { VerifyRegistrationRequest } from "../interfaces/request/verify-registration-request.js";
import { AuthenticationResponse } from "../interfaces/response/authentication-response.js";
import { GameController } from "../models/game-controller.js";
import { GameState } from "../models/game-state.js";
import { LocalEvent } from "../models/local-event.js";
import { ServerError } from "../models/server-error.js";
import { ServerRegistration } from "../models/server-registration.js";
import { WebAuthnUtils } from "../utils/webauthn-utils.js";
import { APIService } from "./api-service.js";
import { EventProcessorService } from "./event-processor-service.js";

export class CredentialService {
  private gameState: GameState;
  private apiService: APIService;
  private eventProcessorService: EventProcessorService;

  constructor(gameController: GameController) {
    this.gameState = gameController.getGameState();
    this.apiService = gameController.getAPIService();
    this.eventProcessorService = gameController.getEventProcessorService();
  }

  public async getCredential(): Promise<void> {
    const transactionId = crypto.randomUUID();
    const authenticationOptionsRequest: AuthenticationOptionsRequest = {
      transaction_id: transactionId,
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
      transaction_id: transactionId,
      authentication_response: WebAuthnUtils.serializeCredential(
        credential as PublicKeyCredential
      ),
    };

    try {
      const response = await this.apiService.verifyAuthenticationResponse(
        verifyAuthenticationRequest
      );

      this.handleAuthenticationResponse(response);
    } catch (error) {
      if (this.isCredentialNotFoundError(error)) {
        this.signalUnknownCredential(authenticationOptions.rpId, credential.id);
      }

      throw error;
    }
  }

  public async createCredential(
    name: string,
    displayName: string
  ): Promise<void> {
    if (window.PublicKeyCredential === undefined) {
      throw new Error(
        "It looks like your browser or device doesn't support passkeys, which are required to play the game. Please try using a different browser or device."
      );
    }

    const transactionId = crypto.randomUUID();
    const registrationOptionsRequest: RegistrationOptionsRequest = {
      transaction_id: transactionId,
      display_name: displayName,
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
      transaction_id: transactionId,
      registration_response: WebAuthnUtils.serializeCredential(
        credential as PublicKeyCredential
      ),
    };

    const response = await this.apiService.verifyRegistration(
      verifyRegistrationRequest
    );

    this.handleAuthenticationResponse(response);
  }

  private isCredentialNotFoundError(error: unknown): error is ServerError {
    return (
      error instanceof ServerError && error.code === "CREDENTIAL_NOT_FOUND"
    );
  }

  private async signalUnknownCredential(
    rpId: string,
    credentialId: string
  ): Promise<void> {
    // @ts-expect-error property is not defined in the type definition
    if (PublicKeyCredential.signalUnknownCredential) {
      // @ts-expect-error property is not defined in the type definition
      await PublicKeyCredential.signalUnknownCredential({
        rpId,
        credentialId,
      });

      console.log(
        `Signaled unknown credential for credential (${credentialId})`
      );
    }
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
