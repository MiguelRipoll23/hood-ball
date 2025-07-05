export interface ICryptoService {
  encryptRequest(request: string): Promise<ArrayBuffer>;
  decryptResponse(response: ArrayBuffer): Promise<string>;
}
