import type { SerializedCredential } from "../serialized-credential-interface.js";

export interface VerifyRegistrationRequest {
  transactionId: string;
  registrationResponse: SerializedCredential;
}
