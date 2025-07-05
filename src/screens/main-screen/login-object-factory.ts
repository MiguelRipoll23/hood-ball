import { MessageEntity } from "../../entities/common/message-entity.js";
import { CloseableMessageEntity } from "../../entities/common/closeable-message-entity.js";

export interface LoginObjects {
  message: MessageEntity;
  closeableMessage: CloseableMessageEntity;
}

export class LoginObjectFactory {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  public createObjects(): LoginObjects {
    const message = new MessageEntity(this.canvas);
    const closeableMessage = new CloseableMessageEntity(this.canvas);
    return { message, closeableMessage };
  }
}
