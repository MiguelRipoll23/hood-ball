import { injectable } from "@needle-di/core";
import { MatchAction } from "../../models/match-action.js";

type MatchActionListener = (actions: MatchAction[]) => void;

@injectable()
export class MatchActionsLogService {
  private readonly maxActions = 5;
  private actions: MatchAction[] = [];
  private listeners: MatchActionListener[] = [];

  public addAction(action: MatchAction): void {
    this.actions.push(action);
    if (this.actions.length > this.maxActions) {
      this.actions.splice(0, this.actions.length - this.maxActions);
    }
    this.notifyListeners();
  }

  public getActions(): MatchAction[] {
    return [...this.actions];
  }

  public clear(): void {
    if (this.actions.length === 0) {
      return;
    }

    this.actions.length = 0;
    this.notifyListeners();
  }

  public onChange(listener: MatchActionListener): () => void {
    this.listeners.push(listener);
    listener(this.getActions());

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getActions();
    [...this.listeners].forEach((listener) => listener(snapshot));
  }
}
