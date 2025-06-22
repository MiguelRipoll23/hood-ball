import {
  CANVAS_EXTRA_MARGIN,
  CANVAS_MARGIN,
} from "../constants/canvas-constants.js";
import type { WebRTCPeer } from "../interfaces/webrtc/webrtc-peer.js";
import { BaseMoveableGameObject } from "../objects/base/base-moveable-game-object.js";

export class ObjectUtils {
  public static hasInvalidOwner(
    webrtcPeer: WebRTCPeer,
    ownerId: string
  ): boolean {
    if (webrtcPeer.getPlayer()?.isHost()) {
      return false;
    }

    return webrtcPeer.getPlayer()?.getId() !== ownerId;
  }

  public static fixObjectPositionIfOutOfBounds(
    moveableObject: BaseMoveableGameObject,
    canvas: HTMLCanvasElement
  ) {
    let hasChanged = false;

    const objectX = moveableObject.getX();
    const objectY = moveableObject.getY();
    const objectWidth = moveableObject.getWidth();
    const objectHeight = moveableObject.getHeight();

    const objectLeft = objectX - objectWidth / 2;
    const objectRight = objectX + objectWidth / 2;
    const objectTop = objectY - objectHeight / 2;
    const objectBottom = objectY + objectHeight / 2;

    // Get the canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    if (objectLeft < CANVAS_MARGIN) {
      moveableObject.setX(objectX + CANVAS_EXTRA_MARGIN); // Prevent going out of the left boundary
      hasChanged = true;
    } else if (objectRight > canvasWidth - CANVAS_MARGIN) {
      moveableObject.setX(objectX - CANVAS_EXTRA_MARGIN); // Prevent going out of the right boundary
      hasChanged = true;
    }

    // Adjust Y position if out of bounds
    if (objectTop < CANVAS_MARGIN) {
      moveableObject.setY(objectY + CANVAS_EXTRA_MARGIN); // Prevent going out of the top boundary
      hasChanged = true;
    } else if (objectBottom > canvasHeight - CANVAS_MARGIN) {
      moveableObject.setY(objectY - CANVAS_EXTRA_MARGIN); // Prevent going out of the bottom boundary
      hasChanged = true;
    }

    if (hasChanged) {
      moveableObject.setSync(true);
    }
  }
}
