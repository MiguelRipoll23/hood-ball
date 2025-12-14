import type { GameEntity } from "../models/game-entity.js";

/**
 * Entity Registry Service
 *
 * Manages entity type registration for recording playback and provides
 * centralized entity ID generation.
 *
 * Uses numeric type IDs to remain game-agnostic. Game layer can define
 * its own enum (e.g., EntityRegistryType) that maps to these numbers.
 */
export class EntityRegistry {
  private static registry = new Map<number, () => GameEntity>();
  private static entityIdCounter = 0;

  /**
   * Register an entity type with its factory function
   *
   * @param typeId - Numeric entity type identifier (game layer can use enum values)
   * @param factory - Factory function that creates a new instance of the entity
   */
  public static register(
    typeId: number,
    factory: () => GameEntity,
  ): void {
    if (this.registry.has(typeId)) {
      console.warn(
        `Entity type "${typeId}" is already registered, overwriting`
      );
    }
    
    this.registry.set(typeId, factory);
  }

  /**
   * Create an entity instance by its type ID
   *
   * @param typeId - Numeric entity type identifier (game layer can use enum values)
   * @returns A new entity instance, or null if the type is not registered
   */
  public static create(typeId: number): GameEntity | null {
    const factory = this.registry.get(typeId);
    if (!factory) {
      console.warn(
        `Entity type "${typeId}" is not registered in the entity registry`
      );
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
  public static has(typeId: number): boolean {
    return this.registry.has(typeId);
  }

  /**
   * Get all registered entity type IDs
   */
  public static getRegisteredTypes(): number[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Get the next entity ID for entity creation
   *
   * @returns The next unique entity ID number
   */
  public static getNextId(): number {
    return ++this.entityIdCounter;
  }

  /**
   * Get the current entity ID counter value (useful for debugging)
   *
   * @returns The current counter value
   */
  public static getEntityIdCounter(): number {
    return this.entityIdCounter;
  }

  /**
   * Clear all registered entity types (useful for testing)
   */
  public static clear(): void {
    this.registry.clear();
  }

  /**
   * Reset the entity ID counter (useful for testing)
   */
  public static resetCounter(): void {
    this.entityIdCounter = 0;
  }
}
