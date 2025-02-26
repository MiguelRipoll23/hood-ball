import { SerializedCredential } from "../serialized-credential.js";

export interface VerifyRegistrationRequest {
  transaction_id: string;
  registration_response: SerializedCredential;
}
