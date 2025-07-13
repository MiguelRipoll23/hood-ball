import { CloseableWindowEntity } from "./common/closeable-window-entity.js";

export class ServerMessageWindowEntity extends CloseableWindowEntity {
  private index: number = 0;
  private next: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

  public getIndex(): number {
    return this.index;
  }

  public getNext(): boolean {
    return this.next;
  }

  public openMessage(
    index: number,
    length: number,
    title: string,
    content: string
  ): void {
    this.index = index;
    this.next = false;

    const pages = `${index + 1}/${length}`;
    console.log(`Opening server message (${pages})`);

    super.open(`SERVER MESSAGE (${pages})`, title, content);
  }

  public override close(): void {
    this.next = true;
  }

  public closeAll(): void {
    this.next = false;
    super.close();
  }
}
