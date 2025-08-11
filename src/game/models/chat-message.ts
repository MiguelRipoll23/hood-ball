export class ChatMessage {
  private userId: string;
  private text: string;
  private timestamp: number;

  constructor(userId: string, text: string, timestamp: number) {
    this.userId = userId;
    this.text = text;
    this.timestamp = timestamp;
  }

  public getUserId(): string {
    return this.userId;
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public getText(): string {
    return this.text;
  }

  public setText(text: string): void {
    this.text = text;
  }

  public getTimestamp(): number {
    return this.timestamp;
  }

  public setTimestamp(timestamp: number): void {
    this.timestamp = timestamp;
  }
}
