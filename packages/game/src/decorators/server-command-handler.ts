import type { WebSocketType } from "../enums/websocket-type.js";
import type { ServerCommandHandlerMetadata } from "../interfaces/services/network/server-command-handler-metadata.js";

const commandHandlers: ServerCommandHandlerMetadata[] = [];

export function ServerCommandHandler(commandId: WebSocketType) {
  return function (
    target: object,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
  ) {
    // Validate method signature if possible
    if (typeof propertyDescriptor.value !== "function") {
      throw new Error(`@ServerCommandHandler can only be applied to methods`);
    }

    // Prevent duplicate registrations
    if (hasServerCommandHandler(target, propertyKey, commandId)) {
      console.warn(
        `Duplicate @ServerCommandHandler registration for ${propertyKey} with command ${commandId}`
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

export function getServerCommandHandlers(): ServerCommandHandlerMetadata[] {
  return commandHandlers;
}

export function clearServerCommandHandlers(): void {
  commandHandlers.length = 0;
}

export function hasServerCommandHandler(
  target: object,
  methodName: string,
  commandId: WebSocketType
): boolean {
  return commandHandlers.some(
    (h) =>
      h.target === target &&
      h.methodName === methodName &&
      h.commandId === commandId
  );
}
