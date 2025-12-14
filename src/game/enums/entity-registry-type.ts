/**
 * Entity Registry Type Enum
 * 
 * Defines all entity types that can be registered and spawned via EntityRegistry.
 * Used for recording/playback to ensure type-safe entity creation.
 */
export enum EntityRegistryType {
  // Core gameplay entities
  Ball = 0,
  LocalCar = 1,
  RemoteCar = 2,
  NpcCar = 3,
  Goal = 4,
  GoalExplosion = 5,
  CarExplosion = 6,
  BoostPad = 7,

  // UI entities
  Scoreboard = 10,
  Alert = 11,
  Toast = 12,
  Help = 13,
  MatchLog = 14,
  BoostMeter = 15,

  // Background entities
  WorldBackground = 20,
}
