import type { WebRTCPeer } from "../interfaces/network/webrtc-peer-interface.js";
import {
  CANVAS_EXTRA_MARGIN,
  FIELD_BORDER_MARGIN,
} from "../constants/canvas-constants.js";
import type { GameEntity } from "../models/game-entity.js";

/**
 * Duck-type interface for entities that have position and size.
 */
export interface MoveableEntity extends GameEntity {
  getX(): number;
  setX(x: number): void;
  getY(): number;
  setY(y: number): void;
  getWidth(): number;
  getHeight(): number;
  setSyncReliably?(sync: boolean): void;
}

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
    moveableEntity: MoveableEntity,
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

    // Only correct when the entity has crossed the visible field border
    // (which is inset FIELD_BORDER_MARGIN from the canvas edge), instead of
    // firing while the entity is still inside the playable field.
    if (entityLeft < FIELD_BORDER_MARGIN) {
      moveableEntity.setX(entityX + CANVAS_EXTRA_MARGIN); // Prevent going out of the left boundary
      hasChanged = true;
    } else if (entityRight > canvasWidth - FIELD_BORDER_MARGIN) {
      moveableEntity.setX(entityX - CANVAS_EXTRA_MARGIN); // Prevent going out of the right boundary
      hasChanged = true;
    }

    // Adjust Y position if out of bounds
    if (entityTop < FIELD_BORDER_MARGIN) {
      moveableEntity.setY(entityY + CANVAS_EXTRA_MARGIN); // Prevent going out of the top boundary
      hasChanged = true;
    } else if (entityBottom > canvasHeight - FIELD_BORDER_MARGIN) {
      moveableEntity.setY(entityY - CANVAS_EXTRA_MARGIN); // Prevent going out of the bottom boundary
      hasChanged = true;
    }

    if (hasChanged) {
      moveableEntity.setSyncReliably?.(true);
    }
  }
}
