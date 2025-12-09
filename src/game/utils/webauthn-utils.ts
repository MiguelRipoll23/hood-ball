import type { SerializedCredential } from "../interfaces/serialized-credential.js";
import { Base64Utils } from "../../engine/utils/base64-utils.js";

export class WebAuthnUtils {
  public static serializeCredential(
    credential: PublicKeyCredential
  ): SerializedCredential {
    const { type, rawId, response } = credential;

    return {
      id: Base64Utils.arrayBufferToBase64Url(rawId),
      type,
      rawId: Base64Utils.arrayBufferToBase64Url(rawId),
      response: {
        clientDataJSON: Base64Utils.arrayBufferToBase64Url(
          response.clientDataJSON
        ),
        attestationObject: (response as AuthenticatorAttestationResponse)
          .attestationObject
          ? Base64Utils.arrayBufferToBase64Url(
              (response as AuthenticatorAttestationResponse).attestationObject!
            )
          : null,
        authenticatorData: (response as AuthenticatorAssertionResponse)
          .authenticatorData
          ? Base64Utils.arrayBufferToBase64Url(
              (response as AuthenticatorAssertionResponse).authenticatorData!
            )
          : null,
        signature: (response as AuthenticatorAssertionResponse).signature
          ? Base64Utils.arrayBufferToBase64Url(
              (response as AuthenticatorAssertionResponse).signature!
            )
          : null,
        userHandle: (response as AuthenticatorAssertionResponse).userHandle
          ? Base64Utils.arrayBufferToBase64Url(
              (response as AuthenticatorAssertionResponse).userHandle!
            )
          : null,
      },
    };
  }

  public static challengeToArrayBuffer(challenge: string): ArrayBuffer {
    return Base64Utils.base64UrlToArrayBuffer(challenge);
  }
}
