import type { SerializedCredential } from "../serialized-credential.js";

export interface VerifyAuthenticationRequest {
  transaction_id: string;
  authentication_response: SerializedCredential;
}
