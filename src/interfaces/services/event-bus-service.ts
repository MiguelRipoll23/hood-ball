export interface IEventBusService {
  on(type: string, callback: (payload: unknown) => void): void;
  off(type: string, callback: (payload: unknown) => void): void;
  emit(type: string, payload: unknown): void;
}
