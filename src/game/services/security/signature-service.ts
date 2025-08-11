import { injectable } from "@needle-di/core";

@injectable()
export class SignatureService {
  private static readonly ALGORITHM_NAME = "ECDSA";
  private static readonly NAMED_CURVE = "P-256";
  private static readonly VERIFY_USAGE: KeyUsage = "verify";
  private static readonly SIGN_HASH = "SHA-256";

  private publicKey: CryptoKey | null = null;

  public async init(base64PublicKey: string): Promise<void> {
    const publicKeyBuffer = this.decodeBase64(base64PublicKey);

    this.publicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      {
        name: SignatureService.ALGORITHM_NAME,
        namedCurve: SignatureService.NAMED_CURVE,
      },
      true,
      [SignatureService.VERIFY_USAGE]
    );
  }

  public async verifyArrayBuffer(
    data: ArrayBuffer,
    signature: ArrayBuffer
  ): Promise<boolean> {
    const publicKey = this.getPublicKey();

    return crypto.subtle.verify(
      {
        name: SignatureService.ALGORITHM_NAME,
        hash: { name: SignatureService.SIGN_HASH },
      },
      publicKey,
      signature,
      data
    );
  }

  private decodeBase64(base64: string): ArrayBuffer {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
  }

  private getPublicKey(): CryptoKey {
    if (!this.publicKey) {
      throw new Error("Public key not initialized");
    }

    return this.publicKey;
  }
}
