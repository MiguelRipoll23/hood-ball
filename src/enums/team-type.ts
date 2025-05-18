export const TeamType = {
  Blue: "Blue",
  Red: "Red",
} as const;
export type TeamType = (typeof TeamType)[keyof typeof TeamType];
