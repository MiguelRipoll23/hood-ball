export const SCALE_FACTOR_FOR_ANGLES = 32767 / Math.PI;
export const SCALE_FACTOR_FOR_SPEED = 100;
// Improves precision of position values sent over the network while still
// keeping them within the 16-bit range. Coordinates are multiplied by this
// factor before serialization and divided by it when deserialized.
export const SCALE_FACTOR_FOR_COORDINATES = 10;
