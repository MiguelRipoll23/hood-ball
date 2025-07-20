import type { CommandHandlerMetadata } from "../interfaces/services/network/command-handler-metadata.js";

const commandHandlers: CommandHandlerMetadata[] = [];

export function CommandHandler(commandId: number) {
  return function (
    target: object,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
  ) {
    if (typeof propertyDescriptor.value !== "function") {
      throw new Error(`@CommandHandler can only be applied to methods`);
    }

    if (hasCommandHandler(target, propertyKey, commandId)) {
      console.warn(
        `Duplicate @CommandHandler registration for ${propertyKey} with command ${commandId}`
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

export function getCommandHandlers(): CommandHandlerMetadata[] {
  return commandHandlers;
}

export function clearCommandHandlers(): void {
  commandHandlers.length = 0;
}

export function hasCommandHandler(
  target: object,
  methodName: string,
  commandId: number
): boolean {
  return commandHandlers.some(
    (h) => h.target === target && h.methodName === methodName && h.commandId === commandId
  );
}
