export class GamePlayer {
  private id: string;
  private displayId: string;
  private name: string;
  private host: boolean;
  private score: number;

  private pingTime: number | null = null;

  constructor(
    id: string = crypto.randomUUID(),
    name = "Unknown",
    host = false,
    score = 0
  ) {
    this.id = id.replace(/-/g, "");
    this.displayId = id;
    this.name = name;
    this.score = score;
    this.host = host;
  }

  public getId(): string {
    return this.id;
  }

  public setId(id: string): void {
    this.id = id.replace(/-/g, "");
    this.displayId = id;
  }

  public getDisplayId(): string {
    return this.displayId;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string): void {
    this.name = name;
  }

  public isHost(): boolean {
    return this.host;
  }

  public setHost(host: boolean): void {
    this.host = host;
  }

  public getScore(): number {
    return this.score;
  }

  public sumScore(score: number): void {
    this.score += score;
  }

  public setScore(score: number): void {
    this.score = score;
  }

  public getPingTime(): number | null {
    return this.pingTime;
  }

  public setPingTime(pingTime: number): void {
    this.pingTime = pingTime;
  }

  public reset(): void {
    this.host = false;
    this.pingTime = null;
    this.score = 0;

    console.log("Player with name", this.name + " has been reset");
  }
}
