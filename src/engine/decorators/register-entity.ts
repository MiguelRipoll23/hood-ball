import type { GameEntity } from "../models/game-entity.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EntityConstructor {
  new (...args: any[]): GameEntity;
}

const entityRegistry = new Map<string, EntityConstructor>();

/**
 * Decorator to register an entity class for use in recordings and playback.
 * This allows the media player to instantiate entities from recorded data.
 * 
 * Usage:
 * @RegisterEntity
 * export class BallEntity extends BaseDynamicCollidingGameEntity {
 *   // ...
 * }
 */
export function RegisterEntity(constructor: EntityConstructor): void {
  const name = constructor.name;
  
  if (entityRegistry.has(name)) {
    console.warn(`Entity "${name}" is already registered. Skipping duplicate registration.`);
    return;
  }
  
  entityRegistry.set(name, constructor);
  console.log(`Entity "${name}" registered for recordings`);
}

/**
 * Get the constructor for a registered entity by name
 */
export function getEntityConstructor(name: string): EntityConstructor | undefined {
  return entityRegistry.get(name);
}

/**
 * Get all registered entity names
 */
export function getRegisteredEntityNames(): string[] {
  return Array.from(entityRegistry.keys());
}

/**
 * Check if an entity is registered
 */
export function isEntityRegistered(name: string): boolean {
  return entityRegistry.has(name);
}

/**
 * Clear all entity registrations (useful for testing)
 */
export function clearEntityRegistry(): void {
  entityRegistry.clear();
}

/**
 * Get the number of registered entities
 */
export function getRegisteredEntityCount(): number {
  return entityRegistry.size;
}
