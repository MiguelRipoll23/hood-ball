import type { WebRTCPeer } from "../../game/interfaces/services/network/webrtc-peer.js";
import {
  CANVAS_EXTRA_MARGIN,
  CANVAS_MARGIN,
} from "../constants/canvas-constants.js";
import { BaseMoveableGameEntity } from "../entities/base-moveable-game-entity.js";

export class EntityUtils {
  public static hasInvalidOwner(
    webrtcPeer: WebRTCPeer,
    ownerId: string
  ): boolean {
    if (webrtcPeer.getPlayer()?.isHost()) {
      return false;
    }

    return webrtcPeer.getPlayer()?.getNetworkId() !== ownerId;
  }

  public static fixEntityPositionIfOutOfBounds(
    moveableEntity: BaseMoveableGameEntity,
    canvas: HTMLCanvasElement
  ) {
    let hasChanged = false;

    const entityX = moveableEntity.getX();
    const entityY = moveableEntity.getY();
    const entityWidth = moveableEntity.getWidth();
    const entityHeight = moveableEntity.getHeight();

    const entityLeft = entityX - entityWidth / 2;
    const entityRight = entityX + entityWidth / 2;
    const entityTop = entityY - entityHeight / 2;
    const entityBottom = entityY + entityHeight / 2;

    // Get the canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    if (entityLeft < CANVAS_MARGIN) {
      moveableEntity.setX(entityX + CANVAS_EXTRA_MARGIN); // Prevent going out of the left boundary
      hasChanged = true;
    } else if (entityRight > canvasWidth - CANVAS_MARGIN) {
      moveableEntity.setX(entityX - CANVAS_EXTRA_MARGIN); // Prevent going out of the right boundary
      hasChanged = true;
    }

    // Adjust Y position if out of bounds
    if (entityTop < CANVAS_MARGIN) {
      moveableEntity.setY(entityY + CANVAS_EXTRA_MARGIN); // Prevent going out of the top boundary
      hasChanged = true;
    } else if (entityBottom > canvasHeight - CANVAS_MARGIN) {
      moveableEntity.setY(entityY - CANVAS_EXTRA_MARGIN); // Prevent going out of the bottom boundary
      hasChanged = true;
    }

    if (hasChanged) {
      moveableEntity.setSyncReliably(true);
    }
  }
}
