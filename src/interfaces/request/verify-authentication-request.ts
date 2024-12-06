import { SerializedCredential } from "../serialized-credential.js";

export interface VerifyAuthenticationRequest {
  requestId: string;
  authenticationResponse: SerializedCredential;
}
