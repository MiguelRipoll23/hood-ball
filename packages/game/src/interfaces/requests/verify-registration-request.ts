import type { SerializedCredential } from "../serialized-credential.js";

export interface VerifyRegistrationRequest {
  transactionId: string;
  registrationResponse: SerializedCredential;
}
