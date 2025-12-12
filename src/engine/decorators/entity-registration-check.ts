/**
 * Entity Registration Check
 * 
 * This file imports all game entities to ensure their @RegisterEntity decorators
 * are executed at runtime. This is important because decorators only run when
 * the class is imported.
 * 
 * Import this file early in your application bootstrap to ensure all entities
 * are registered before the media player needs them.
 */

// Import all entities that should be registered for recording/playback
import "../../game/entities/ball-entity.js";
import "../../game/entities/car-entity.js";
import "../../game/entities/boost-pad-entity.js";
import "../../game/entities/goal-entity.js";
import "../../game/entities/scoreboard-entity.js";

// You can add more entity imports here as needed

import { getRegisteredEntityCount, getRegisteredEntityNames } from "./register-entity.js";

/**
 * Log the currently registered entities
 * Call this function during application startup to verify entity registration
 */
export function logRegisteredEntities(): void {
  const count = getRegisteredEntityCount();
  const names = getRegisteredEntityNames();
  
  console.log(`[Entity Registry] ${count} entities registered for recording playback:`);
  names.forEach(name => console.log(`  - ${name}`));
}

/**
 * Verify that expected entities are registered
 * Throws an error if any expected entity is missing
 */
export function verifyEntityRegistration(expectedEntities: string[]): void {
  const registeredNames = getRegisteredEntityNames();
  const missing = expectedEntities.filter(name => !registeredNames.includes(name));
  
  if (missing.length > 0) {
    throw new Error(`Missing entity registrations: ${missing.join(", ")}`);
  }
  
  console.log(`[Entity Registry] All ${expectedEntities.length} expected entities are registered`);
}
