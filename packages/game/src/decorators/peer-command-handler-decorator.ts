import type { PeerCommandHandlerMetadata } from "../interfaces/services/network/peer-command-handler-metadata.js";

const commandHandlers: PeerCommandHandlerMetadata[] = [];

export function PeerCommandHandler(commandId: number) {
  return function (
    target: object,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
  ) {
    if (typeof propertyDescriptor.value !== "function") {
      throw new Error(`@PeerCommandHandler can only be applied to methods`);
    }

    if (hasPeerCommandHandler(target, propertyKey, commandId)) {
      console.warn(
        `Duplicate @PeerCommandHandler registration for ${propertyKey} with command ${commandId}`
      );
      return;
    }

    commandHandlers.push({
      commandId,
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
  commandId: number
): boolean {
  return commandHandlers.some(
    (handler) =>
      handler.target === target &&
      handler.methodName === methodName &&
      handler.commandId === commandId
  );
}
