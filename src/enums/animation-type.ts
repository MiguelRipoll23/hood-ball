export const AnimationType = {
  FadeIn: "fade-in",
  FadeOut: "fade-out",
  MoveX: "move-x",
  MoveY: "move-y",
  Rotate: "rotate",
  Scale: "scale",
} as const;

export type AnimationType = (typeof AnimationType)[keyof typeof AnimationType];
