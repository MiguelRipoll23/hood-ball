import type { GameEntity } from "../models/game-entity.js";

/**
 * Entity Registry for recording playback
 * 
 * Maps entity type identifiers to their factory functions.
 * This allows us to spawn real entities during playback without
 * storing raw constructors or class names.
 */
export class EntityRegistry {
  private static registry = new Map<string, () => GameEntity>();

  /**
   * Register an entity type with its factory function
   * 
   * @param typeId - Unique identifier for the entity type (e.g., "ball", "car", "boost-pad")
   * @param factory - Factory function that creates a new instance of the entity
   */
  public static register(typeId: string, factory: () => GameEntity): void {
    if (this.registry.has(typeId)) {
      console.warn(`Entity type "${typeId}" is already registered, overwriting`);
    }
    this.registry.set(typeId, factory);
  }

  /**
   * Create an entity instance by its type ID
   * 
   * @param typeId - The entity type identifier
   * @returns A new entity instance, or null if the type is not registered
   */
  public static create(typeId: string): GameEntity | null {
    const factory = this.registry.get(typeId);
    if (!factory) {
      console.warn(`Entity type "${typeId}" is not registered in the entity registry`);
      return null;
    }

    try {
      return factory();
    } catch (error) {
      console.error(`Failed to create entity of type "${typeId}":`, error);
      return null;
    }
  }

  /**
   * Check if an entity type is registered
   */
  public static has(typeId: string): boolean {
    return this.registry.has(typeId);
  }

  /**
   * Get all registered entity type IDs
   */
  public static getRegisteredTypes(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Clear all registered entity types (useful for testing)
   */
  public static clear(): void {
    this.registry.clear();
  }
}
