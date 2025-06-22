import type { WebRTCType } from "../enums/webrtc-type";

interface CommandHandlerMetadata {
  commandId: number;
  methodName: string;
  target: any;
}

const commandHandlers: CommandHandlerMetadata[] = [];

export function PeerCommandHandler(commandId: WebRTCType) {
  return function (
    target: any,
    propertyKey: string,
    _propertyDescriptor: PropertyDescriptor
  ) {
    commandHandlers.push({
      commandId: commandId,
      methodName: propertyKey,
      target,
    });
  };
}

export function getPeerCommandHandlers(): CommandHandlerMetadata[] {
  return commandHandlers;
}
