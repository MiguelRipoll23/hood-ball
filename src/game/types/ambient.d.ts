declare module '@needle-di/core';

// Minimal declarations for jsimgui used in debug windows
declare module '@mori2003/jsimgui' {
  export const ImGui: any;
  export const ImGuiImplWeb: any;
  export class ImVec2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
  }
  export enum ImGuiWindowFlags {}
}

declare module '*.css';
