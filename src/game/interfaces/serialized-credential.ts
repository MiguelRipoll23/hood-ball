export interface SerializedCredential {
  id: string;
  type: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string | null;
    authenticatorData: string | null;
    signature: string | null;
    userHandle: string | null;
  };
}
