import { getPeerCommandHandlers } from "../decorators/peer-command-handler-decorator";
import { WebRTCType } from "../enums/webrtc-type";
import type { WebRTCPeer } from "../interfaces/webrtc-peer";
import type { BinaryReader } from "../utils/binary-reader-utils";

type CommandHandlerFunction = (
  webrtcPeer: WebRTCPeer,
  binaryReader: BinaryReader
) => void;

export class WebRTCDispatcherService {
  private commandHandlers = new Map<WebRTCType, CommandHandlerFunction>();

  public registerCommandHandlers(instance: any): void {
    const commandHandlers = getPeerCommandHandlers().filter(
      (commandHandler) =>
        commandHandler.target === Object.getPrototypeOf(instance)
    );

    for (const { commandId, methodName } of commandHandlers) {
      const boundMethod = instance[methodName].bind(instance);
      this.bindCommandHandler(commandId, boundMethod);
    }
  }

  public dispatchCommandHandler(
    commandId: WebRTCType,
    webrtcPeer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void {
    const commandHandler = this.commandHandlers.get(commandId);

    if (commandHandler === undefined) {
      console.warn(`No command handler found for ${WebRTCType[commandId]}`);
      return;
    }

    commandHandler(webrtcPeer, binaryReader);
  }

  private bindCommandHandler(
    commandId: WebRTCType,
    commandHandler: CommandHandlerFunction
  ): void {
    this.commandHandlers.set(commandId, commandHandler);
    console.log(`Command handler bound for ${WebRTCType[commandId]}`);
  }
}
