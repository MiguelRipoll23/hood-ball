import { getCommandHandlers } from "../../decorators/command-handler.js";
import type { CommandHandlerMetadata } from "../../interfaces/services/network/command-handler-metadata.js";

export class CommandDispatcherService<C extends number, F extends (...args: any[]) => void> {
  private commandHandlers = new Map<C, F>();

  public registerCommandHandlers(instance: any): void {
    const handlers = getCommandHandlers().filter(
      (h: CommandHandlerMetadata) => h.target === Object.getPrototypeOf(instance)
    );

    for (const { commandId, methodName } of handlers) {
      const method = (instance as any)[methodName];

      if (typeof method !== "function") {
        console.error(
          `Method "${methodName}" not found or is not a function on the instance.`
        );
        continue;
      }

      const boundMethod = method.bind(instance) as F;
      this.bindCommandHandler(commandId as C, boundMethod);
    }
  }

  public dispatchCommand(commandId: C, ...args: Parameters<F>): void {
    const commandHandler = this.commandHandlers.get(commandId);

    if (commandHandler === undefined) {
      console.warn(`No command handler found for ${String(commandId)}`);
      return;
    }

    try {
      (commandHandler as (...a: any[]) => void)(...args);
    } catch (error) {
      console.error(
        `Error executing command handler for ${String(commandId)}:`,
        error
      );
    }
  }

  private bindCommandHandler(commandId: C, commandHandler: F): void {
    this.commandHandlers.set(commandId, commandHandler);
    console.log(`Command handler bound for ${String(commandId)}`);
  }
}
