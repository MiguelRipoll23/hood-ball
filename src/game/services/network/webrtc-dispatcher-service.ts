import { getPeerCommandHandlers } from "../../decorators/peer-command-handler-decorator.js";
import { WebRTCType } from "../../enums/webrtc-type.js";
import type { WebRTCPeer } from "../../interfaces/services/network/webrtc-peer.js";
import type { PeerCommandHandlerFunction } from "../../types/peer-command-handler-function-type.js";
import type { BinaryReader } from "../../../core/utils/binary-reader-utils.js";

export class WebRTCDispatcherService {
  private readonly commandHandlers = new Map<number, PeerCommandHandlerFunction>();

  public registerCommandHandlers(instance: unknown): void {
    const commandHandlers = getPeerCommandHandlers().filter(
      (commandHandler) =>
        commandHandler.target === Object.getPrototypeOf(instance)
    );

    for (const { commandId, methodName } of commandHandlers) {
      const method = (instance as Record<string, unknown>)[methodName];

      if (typeof method !== "function") {
        console.error(
          `Method "${methodName}" not found or is not a function on the instance.`
        );
        continue;
      }

      const boundMethod = method.bind(instance) as PeerCommandHandlerFunction;
      this.bindCommandHandler(
        commandId,
        boundMethod,
        WebRTCType[commandId as WebRTCType] ?? `Command(${commandId})`
      );
    }
  }

  public bindCommandHandler(
    commandId: number,
    commandHandler: PeerCommandHandlerFunction,
    label?: string
  ): void {
    this.commandHandlers.set(commandId, commandHandler);
    const resolvedLabel = label ?? WebRTCType[commandId as WebRTCType] ?? `Command(${commandId})`;
    console.log(`Peer command handler bound for ${resolvedLabel}`);
  }

  public dispatchCommand(
    commandId: number,
    webrtcPeer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void {
    const commandHandler = this.commandHandlers.get(commandId);

    if (commandHandler === undefined) {
      const label = WebRTCType[commandId as WebRTCType] ?? `Command(${commandId})`;
      console.warn(`No peer command handler found for ${label}`);
      return;
    }

    commandHandler(webrtcPeer, binaryReader);
  }
}
