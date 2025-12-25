export type ToolId = "crop" | "title" | null;

export type TitlePreset = "medium" | "center" | "overlay";

export type DownloadFormat = "png" | "jpeg";

export type TitleSizeLevel = 0 | 1 | 2;

export type TitleWeight = "regular" | "bold";

export type TitleColor = "white" | "black" | "accent";

export type TitleAlign = "left" | "center" | "right";

export type NormalizedPoint = {
  x: number;
  y: number;
};

export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

