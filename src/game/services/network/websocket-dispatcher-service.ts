import { getServerCommandHandlers } from "../../decorators/server-command-handler.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import type { ServerCommandHandlerFunction } from "../../types/server-command-handler-function-type.js";
import type { BinaryReader } from "../../../engine/utils/binary-reader-utils.js";

export class WebSocketDispatcherService {
  private commandHandlers = new Map<
    WebSocketType,
    ServerCommandHandlerFunction
  >();

  public registerCommandHandlers(instance: any): void {
    const commandHandlers = getServerCommandHandlers().filter(
      (commandHandler) =>
        commandHandler.target === Object.getPrototypeOf(instance)
    );

    for (const { commandId, methodName } of commandHandlers) {
      const method = instance[methodName];

      if (typeof method !== "function") {
        console.error(
          `Method "${methodName}" not found or is not a function on the instance.`
        );
        continue;
      }

      const boundMethod = instance[methodName].bind(instance);
      this.bindCommandHandler(commandId, boundMethod);
    }
  }

  public dispatchCommand(
    commandId: WebSocketType,
    binaryReader: BinaryReader
  ): void {
    const commandHandler = this.commandHandlers.get(commandId);

    if (commandHandler === undefined) {
      console.warn(
        `No server command handler found for ${WebSocketType[commandId]}`
      );
      return;
    }

    try {
      commandHandler(binaryReader);
    } catch (error) {
      console.error(
        `Error executing command handler for ${WebSocketType[commandId]}:`,
        error
      );
    }
  }

  private bindCommandHandler(
    commandId: WebSocketType,
    commandHandler: ServerCommandHandlerFunction
  ): void {
    this.commandHandlers.set(commandId, commandHandler);
    console.log(`Server command handler bound for ${WebSocketType[commandId]}`);
  }
}
