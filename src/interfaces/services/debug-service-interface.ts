export interface IDebugService {
  isInitialized(): boolean;
  init(): Promise<void>;
  render(): void;
}
