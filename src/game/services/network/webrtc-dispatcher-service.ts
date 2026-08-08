import { getPeerCommandHandlers } from "../../../engine/decorators/peer-command-handler-decorator.js";
import { WebRTCType } from "../../../engine/enums/webrtc-type.js";
import type { WebRTCPeer } from "../../../engine/interfaces/network/webrtc-peer-interface.js";
import type { PeerCommandHandlerFunction } from "../../types/peer-command-handler-function-type.js";
import type { BinaryReader } from "../../../engine/utils/binary-reader-utils.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";

export class WebRTCDispatcherService {
  private commandHandlers = new Map<WebRTCType, PeerCommandHandlerFunction>();

  public registerCommandHandlers(instance: any): void {
    const commandHandlers = getPeerCommandHandlers().filter(
      (commandHandler) =>
        commandHandler.target === Object.getPrototypeOf(instance)
    );

    for (const { commandId, methodName } of commandHandlers) {
      const method = instance[methodName];

      if (typeof method !== "function") {
        EngineLogger.error("WebrtcDispatcherService", 
          `Method "${methodName}" not found or is not a function on the instance.`
        );
        continue;
      }

      const boundMethod = instance[methodName].bind(instance);
      this.bindCommandHandler(commandId, boundMethod);
    }
  }

  public dispatchCommand(
    commandId: WebRTCType,
    webrtcPeer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void {
    const commandHandler = this.commandHandlers.get(commandId);

    if (commandHandler === undefined) {
      EngineLogger.warn("WebrtcDispatcherService", 
        `No peer command handler found for ${WebRTCType[commandId]}`
      );
      return;
    }

    const result = commandHandler(webrtcPeer, binaryReader);
    if (result instanceof Promise) {
      result.catch((error) =>
        EngineLogger.error("WebrtcDispatcherService", 
          `Unhandled error in async peer command handler for ${WebRTCType[commandId]}:`,
          error
        )
      );
    }
  }

  private bindCommandHandler(
    commandId: WebRTCType,
    commandHandler: PeerCommandHandlerFunction
  ): void {
    this.commandHandlers.set(commandId, commandHandler);
    EngineLogger.info("WebrtcDispatcherService", `Peer command handler bound for ${WebRTCType[commandId]}`);
  }
}
