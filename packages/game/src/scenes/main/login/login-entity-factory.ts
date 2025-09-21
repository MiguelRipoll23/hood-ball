import { MessageEntity } from "../../../entities/common/message-entity.js";
import { CloseableMessageEntity } from "../../../entities/common/closeable-message-entity.js";

export interface LoginEntities {
  messageEntity: MessageEntity;
  closeableMessageEntity: CloseableMessageEntity;
}

export class LoginEntityFactory {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  public createEntities(): LoginEntities {
    const messageEntity = new MessageEntity(this.canvas);
    const closeableMessageEntity = new CloseableMessageEntity(this.canvas);
    return { messageEntity, closeableMessageEntity };
  }
}
