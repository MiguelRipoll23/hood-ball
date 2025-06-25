import type { IEventBusService } from "../interfaces/services/event-bus-service.js";

export class EventBusService implements IEventBusService {
  private readonly target = new EventTarget();
  private readonly listeners = new Map<(payload: unknown) => void, EventListener>();

  public on(type: string, callback: (payload: unknown) => void): void {
    const listener = (event: Event) => callback((event as CustomEvent).detail);
    this.listeners.set(callback, listener as EventListener);
    this.target.addEventListener(type, listener as EventListener);
  }

  public off(type: string, callback: (payload: unknown) => void): void {
    const listener = this.listeners.get(callback);
    if (listener) {
      this.target.removeEventListener(type, listener);
      this.listeners.delete(callback);
    }
  }

  public emit(type: string, payload: unknown): void {
    this.target.dispatchEvent(new CustomEvent(type, { detail: payload }));
  }
}
