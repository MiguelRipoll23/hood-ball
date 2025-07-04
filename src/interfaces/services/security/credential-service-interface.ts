export interface ICredentialService {
  getCredential(): Promise<void>;
  createCredential(name: string, displayName: string): Promise<void>;
}
