/**
 * Classifies entities for recording purposes
 */
export enum EntityRecordingType {
  /**
   * Static entities that don't move or change (terrain, buildings, props)
   * These are not recorded during gameplay
   */
  Static = "static",
  
  /**
   * Dynamic entities that can move and change state
   * These are tracked for spawn/despawn and state changes
   */
  Dynamic = "dynamic",
}
