import type { SerializedCredential } from "../serialized-credential.js";

export interface VerifyAuthenticationRequest {
  transactionId: string;
  authenticationResponse: SerializedCredential;
}
