export interface RegistrationOptionsResponse extends CredentialCreationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: {
    type: "public-key";
    alg: number;
  }[];
}
