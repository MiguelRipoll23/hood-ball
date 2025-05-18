export const ObjectStateType = {
  Active: 0,
  Inactive: 1,
} as const;
export type ObjectStateType =
  (typeof ObjectStateType)[keyof typeof ObjectStateType];
