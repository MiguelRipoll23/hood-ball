export interface AuthenticationOptionsResponse {
  rpId: string;
  challenge: string;
  timeout: number;
  userVerification: "required" | "preferred" | "discouraged";
}
