export const ObjectType = {
  Ball: 0,
  RemoteCar: 1,
  Scoreboard: 2,
} as const;
export type ObjectType = (typeof ObjectType)[keyof typeof ObjectType];
