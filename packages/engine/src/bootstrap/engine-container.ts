import { Container as NeedleDIContainer } from "@needle-di/core";
import { registerEngineServices, type BindableContainer } from "./register-engine-services.js";

/** Options used to bootstrap engine-level services. */
export type EngineContainerOptions = {
  /** Canvas element used by rendering services. */
  canvas?: HTMLCanvasElement;
  /** Optional debug flag forwarded to debug-aware services. */
  debugging?: boolean;
};

export type EngineContainer = InstanceType<typeof NeedleDIContainer>;

/**
 * Creates a fresh dependency injection container scoped to engine services.  Game-specific
 * registrations should be layered on top by a dedicated game bootstrap module.
 */
export function createEngineContainer(
  options: EngineContainerOptions = {}
): EngineContainer {
  const container = new NeedleDIContainer();

  registerEngineServices(container as unknown as BindableContainer);

  // Future phases will consume options to bind contextual singletons.
  void options;

  return container;
}
