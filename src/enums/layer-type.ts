export const LayerType = {
  UI: "UI",
  Scene: "Scene",
} as const;
export type LayerType = (typeof LayerType)[keyof typeof LayerType];
