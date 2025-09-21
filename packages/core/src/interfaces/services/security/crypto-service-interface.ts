export interface CryptoServiceContract {
  encryptRequest(request: string): Promise<ArrayBuffer>;
  decryptResponse(response: ArrayBuffer): Promise<string>;
}
