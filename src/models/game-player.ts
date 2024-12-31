export class GamePlayer {
  private id: string;
  private host: boolean;
  private pingTime: number | null = null;
  private name: string;
  private score: number;

  constructor(
    id: string = self.crypto.randomUUID(),
    host: boolean = false,
    name = "Unknown",
    score = 0
  ) {
    this.id = id;
    this.host = host;
    this.name = name;
    this.score = score;
  }

  public getId(): string {
    return this.id;
  }

  public isHost(): boolean {
    return this.host;
  }

  public setHost(host: boolean): void {
    this.host = host;
  }

  public getPingTime(): number | null {
    return this.pingTime;
  }

  public setPingTime(pingTime: number): void {
    this.pingTime = pingTime;
  }

  public getName(): string {
    return this.name;
  }

  public getScore(): number {
    return this.score;
  }

  public setName(name: string): void {
    this.name = name;
  }

  public sumScore(score: number): void {
    this.score += score;
  }

  public setScore(score: number): void {
    this.score = score;
  }

  public reset(): void {
    this.host = false;
    this.pingTime = null;
    this.score = 0;

    console.log("Player with name", this.name + " has been reset");
  }
}
