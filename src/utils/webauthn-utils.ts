import { SerializedCredential } from "../interfaces/serialized-credential.js";

export class WebAuthnUtils {
  public static serializeCredential(
    credential: PublicKeyCredential
  ): SerializedCredential {
    const { type, rawId, response } = credential;

    return {
      id: this.base64UrlEncode(rawId),
      type,
      rawId: this.base64UrlEncode(rawId),
      response: {
        clientDataJSON: this.base64UrlEncode(response.clientDataJSON),
        attestationObject: (response as AuthenticatorAttestationResponse)
          .attestationObject
          ? this.base64UrlEncode(
              (response as AuthenticatorAttestationResponse).attestationObject!
            )
          : null,
        authenticatorData: (response as AuthenticatorAssertionResponse)
          .authenticatorData
          ? this.base64UrlEncode(
              (response as AuthenticatorAssertionResponse).authenticatorData!
            )
          : null,
        signature: (response as AuthenticatorAssertionResponse).signature
          ? this.base64UrlEncode(
              (response as AuthenticatorAssertionResponse).signature!
            )
          : null,
        userHandle: (response as AuthenticatorAssertionResponse).userHandle
          ? this.base64UrlEncode(
              (response as AuthenticatorAssertionResponse).userHandle!
            )
          : null,
      },
    };
  }

  public static challengeToUint8Array(challenge: string): Uint8Array {
    const base64 = challenge.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    return Uint8Array.from(atob(paddedBase64), (c) => c.charCodeAt(0));
  }

  private static base64UrlEncode(data: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(data)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""); // Remove padding
  }
}
