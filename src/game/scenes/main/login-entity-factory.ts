import { MessageEntity } from "../../entities/common/message-entity.js";
import { CloseableMessageEntity } from "../../entities/common/closeable-message-entity.js";
import { AudioToggleEntity } from "../../entities/common/audio-toggle-entity.js";
import { AudioService } from "../../services/audio/audio-service.js";
import { container } from "../../../core/services/di-container.js";

export interface LoginEntities {
  messageEntity: MessageEntity;
  closeableMessageEntity: CloseableMessageEntity;
  audioToggleEntity: AudioToggleEntity;
}

export class LoginEntityFactory {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  public createEntities(): LoginEntities {
    const messageEntity = new MessageEntity(this.canvas);
    const closeableMessageEntity = new CloseableMessageEntity(this.canvas);
    const audioService = container.get(AudioService);
    const audioToggleEntity = new AudioToggleEntity(this.canvas, audioService);
    return { messageEntity, closeableMessageEntity, audioToggleEntity };
  }
}
