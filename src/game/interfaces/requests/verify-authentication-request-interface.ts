import type { SerializedCredential } from "../serialized-credential-interface.js";

export interface VerifyAuthenticationRequest {
  transactionId: string;
  authenticationResponse: SerializedCredential;
}
