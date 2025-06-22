import type { WebRTCType } from "../enums/webrtc-type.js";
import type { PeerCommandHandlerMetadata } from "../interfaces/webrtc/peer-command-handler-metadata.js";

const commandHandlers: PeerCommandHandlerMetadata[] = [];

export function PeerCommandHandler(commandId: WebRTCType) {
  return function (
    target: object,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
  ) {
    // Validate method signature if possible
    if (typeof propertyDescriptor.value !== "function") {
      throw new Error(`@PeerCommandHandler can only be applied to methods`);
    }

    // Prevent duplicate registrations
    if (hasPeerCommandHandler(target, propertyKey, commandId)) {
      console.warn(
        `Duplicate @PeerCommandHandler registration for ${propertyKey} with command ${commandId}`
      );
      return;
    }

    commandHandlers.push({
      commandId: commandId,
      methodName: propertyKey,
      target,
    });
  };
}

export function getPeerCommandHandlers(): PeerCommandHandlerMetadata[] {
  return commandHandlers;
}

export function clearPeerCommandHandlers(): void {
  commandHandlers.length = 0;
}

export function hasPeerCommandHandler(
  target: object,
  methodName: string,
  commandId: WebRTCType
): boolean {
  return commandHandlers.some(
    (h) =>
      h.target === target &&
      h.methodName === methodName &&
      h.commandId === commandId
  );
}
