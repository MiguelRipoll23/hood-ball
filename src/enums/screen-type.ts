export const ScreenType = {
  Unknown: 0,
  World: 1,
} as const;

export type ScreenType = (typeof ScreenType)[keyof typeof ScreenType];
