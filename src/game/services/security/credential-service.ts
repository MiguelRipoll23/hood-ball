import { EventType } from "../../enums/event-type.js";
import type { AuthenticationOptionsRequest } from "../../interfaces/requests/authentication-options.js";
import type { RegistrationOptionsRequest } from "../../interfaces/requests/registration-options-request.js";
import type { VerifyAuthenticationRequest } from "../../interfaces/requests/verify-authentication-request.js";
import type { VerifyRegistrationRequest } from "../../interfaces/requests/verify-registration-request.js";
import type { AuthenticationResponse } from "../../interfaces/responses/authentication-response.js";
import { GameState } from "../../../core/models/game-state.js";
import { LocalEvent } from "../../../core/models/local-event.js";
import { ServerError } from "../../models/server-error.js";
import { ServerRegistration } from "../../models/server-registration.js";
import { Base64Utils } from "../../../core/utils/base64-utils.js";
import { WebAuthnUtils } from "../../utils/webauthn-utils.js";
import { APIService } from "../network/api-service.js";
import { EventProcessorService } from "../../../core/services/gameplay/event-processor-service.js";
import { injectable, inject } from "@needle-di/core";

@injectable()
export class CredentialService {
  constructor(
    private readonly gameState = inject(GameState),
    private readonly apiService = inject(APIService),
    private readonly eventProcessorService = inject(EventProcessorService)
  ) {}

  public async getCredential(): Promise<void> {
    const transactionId = crypto.randomUUID();
    const authenticationOptionsRequest: AuthenticationOptionsRequest = {
      transactionId,
    };

    const authenticationOptions =
      await this.apiService.getAuthenticationOptions(
        authenticationOptionsRequest
      );

    const publicKey = {
      challenge: WebAuthnUtils.challengeToArrayBuffer(
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
      transactionId,
      authenticationResponse: WebAuthnUtils.serializeCredential(
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
      transactionId,
      displayName,
    };

    const registrationOptions = await this.apiService.getRegistrationOptions(
      registrationOptionsRequest
    );

    const challenge = registrationOptions.challenge;
    const encodedUserId = registrationOptions.user.id;
    const userId = Base64Utils.base64UrlToString(encodedUserId);
    const pubKeyCredParams = registrationOptions.pubKeyCredParams;

    const publicKey = {
      ...registrationOptions,
      challenge: WebAuthnUtils.challengeToArrayBuffer(challenge),
      user: {
        id: new TextEncoder().encode(userId),
        name,
        displayName,
      },
      pubKeyCredParams: pubKeyCredParams.map(
        (pkcp: PublicKeyCredentialParameters) => ({
          type: pkcp.type,
          alg: pkcp.alg,
        })
      ),
    };

    const credential = await navigator.credentials.create({
      publicKey,
    });

    const verifyRegistrationRequest: VerifyRegistrationRequest = {
      transactionId,
      registrationResponse: WebAuthnUtils.serializeCredential(
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
    this.gameState
      .getGameServer()
      .setServerRegistration(new ServerRegistration(response));

    const { authenticationToken, userId, displayName } = response;

    this.apiService.setAuthenticationToken(authenticationToken);
    this.gameState.getGamePlayer().setId(userId);
    this.gameState.getGamePlayer().setName(displayName);

    const localEvent = new LocalEvent(EventType.ServerAuthenticated);
    this.eventProcessorService.addLocalEvent(localEvent);
  }
}
