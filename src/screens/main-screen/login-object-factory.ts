import { MessageObject } from "../../objects/common/message-object.js";
import { CloseableMessageObject } from "../../objects/common/closeable-message-object.js";

export interface LoginObjects {
  message: MessageObject;
  closeableMessage: CloseableMessageObject;
}

export class LoginObjectFactory {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  public createObjects(): LoginObjects {
    const message = new MessageObject(this.canvas);
    const closeableMessage = new CloseableMessageObject(this.canvas);
    return { message, closeableMessage };
  }
}
