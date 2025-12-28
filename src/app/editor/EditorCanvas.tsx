"use client";

import type {
  DragEvent,
  PointerEvent,
  RefObject,
} from "react";
import type {
  NormalizedPoint,
  NormalizedRect,
  TitleAlign,
  TitleColor,
  TitlePreset,
  TitleSizeLevel,
  TitleWeight,
} from "./types";

type EditorCanvasProps = {
  imageUrl: string | null;
  title: string;
  titlePreset: TitlePreset;
  titlePosition: NormalizedPoint;
  titleAlign: TitleAlign;
  titleSizeLevel: TitleSizeLevel;
  titleWeight: TitleWeight;
  titleColor: TitleColor;
  cropRect: NormalizedRect | null;
  isDraggingFile: boolean;
  previewRef: RefObject<HTMLDivElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPreviewDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onPreviewDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onPreviewDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onPreviewDrop: (event: DragEvent<HTMLDivElement>) => void;
  onPreviewPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPreviewPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onTitlePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onCropPointerDown: (
    event: PointerEvent<HTMLDivElement>,
    handle: "move" | "nw" | "ne" | "sw" | "se",
  ) => void;
};

export function EditorCanvas({
  imageUrl,
  title,
  titlePreset,
  titlePosition,
  titleAlign,
  titleSizeLevel,
  titleWeight,
  titleColor,
  cropRect,
  isDraggingFile,
  previewRef,
  fileInputRef,
  onPreviewDragOver,
  onPreviewDragEnter,
  onPreviewDragLeave,
  onPreviewDrop,
  onPreviewPointerMove,
  onPreviewPointerUp,
  onTitlePointerDown,
  onCropPointerDown,
}: EditorCanvasProps) {
  const previewBaseClassName =
    "relative flex h-[320px] sm:h-[400px] lg:h-[480px] w-full max-w-3xl items-center justify-center overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/70 shadow-[0_24px_70px_rgba(0,0,0,0.85)]";
  const previewClassName = imageUrl
    ? previewBaseClassName
    : [
        previewBaseClassName,
        "cursor-pointer bg-[radial-gradient(circle_at_top,_rgba(250,250,250,0.08),transparent_55%),radial-gradient(circle_at_bottom,_rgba(24,24,27,0.9),#020617)] shadow-[0_26px_80px_rgba(0,0,0,0.95)]",
        isDraggingFile &&
          "border-emerald-400/80 shadow-[0_0_0_1px_rgba(52,211,153,0.7)]",
      ]
        .filter(Boolean)
        .join(" ");

  return (
    <div className="flex flex-1 items-center justify-center">
      <div
        ref={previewRef}
        className={previewClassName}
        onDragOver={onPreviewDragOver}
        onDragEnter={onPreviewDragEnter}
        onDragLeave={onPreviewDragLeave}
        onDrop={onPreviewDrop}
        onPointerMove={onPreviewPointerMove}
        onPointerUp={onPreviewPointerUp}
        onPointerLeave={onPreviewPointerUp}
        onClick={() => {
          if (!imageUrl) {
            fileInputRef.current?.click();
          }
        }}
      >
        {imageUrl ? (
          <div className="relative flex h-full w-full items-center justify-center">
            <img
              src={imageUrl}
              alt="CITRAPORT editor preview"
              className="relative max-h-[360px] max-w-full rounded-xl object-contain shadow-[0_14px_40px_rgba(0,0,0,0.85)]"
            />
            {title.trim() && (
              <div
                className="absolute z-20 pointer-events-auto"
                style={{
                  left: `${titlePosition.x * 100}%`,
                  top: `${titlePosition.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onPointerDown={onTitlePointerDown}
              >
                <div
                  className={[
                    "inline-flex max-w-xl rounded-2xl backdrop-blur shadow-[0_6px_18px_rgba(0,0,0,0.6)]",
                    titleAlign === "left" &&
                      "items-start justify-start text-left",
                    titleAlign === "right" &&
                      "items-end justify-end text-right",
                    titleAlign === "center" &&
                      "items-center justify-center text-center",
                    titlePreset === "medium" &&
                      "bg-black/70 px-6 py-2 text-sm",
                    titlePreset === "center" &&
                      "bg-black/75 px-7 py-2.5 text-base",
                    titlePreset === "overlay" &&
                      "border border-zinc-400/80 bg-zinc-900/90 px-8 py-2.5 text-base",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span
                    className="block max-w-[20rem] whitespace-pre-line"
                    style={{
                      fontWeight: titleWeight === "bold" ? 600 : 400,
                      fontSize:
                        titleSizeLevel === 0
                          ? "0.9rem"
                          : titleSizeLevel === 2
                          ? "1.1rem"
                          : "1rem",
                      color:
                        titleColor === "black"
                          ? "#020617"
                          : titleColor === "accent"
                          ? "#22c55e"
                          : "#f9fafb",
                    }}
                  >
                    {title}
                  </span>
                </div>
              </div>
            )}
            {cropRect && (
              <div className="pointer-events-none absolute inset-0 z-10">
                <div
                  className="pointer-events-auto absolute border border-emerald-400/90 bg-emerald-400/5 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]"
                  style={{
                    left: `${cropRect.x * 100}%`,
                    top: `${cropRect.y * 100}%`,
                    width: `${cropRect.width * 100}%`,
                    height: `${cropRect.height * 100}%`,
                  }}
                  onPointerDown={(event) => onCropPointerDown(event, "move")}
                >
                  <div
                    className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400 bg-zinc-950"
                    style={{
                      left: "0%",
                      top: "0%",
                    }}
                    onPointerDown={(event) => onCropPointerDown(event, "nw")}
                  />
                  <div
                    className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400 bg-zinc-950"
                    style={{
                      left: "100%",
                      top: "0%",
                    }}
                    onPointerDown={(event) => onCropPointerDown(event, "ne")}
                  />
                  <div
                    className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400 bg-zinc-950"
                    style={{
                      left: "0%",
                      top: "100%",
                    }}
                    onPointerDown={(event) => onCropPointerDown(event, "sw")}
                  />
                  <div
                    className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400 bg-zinc-950"
                    style={{
                      left: "100%",
                      top: "100%",
                    }}
                    onPointerDown={(event) => onCropPointerDown(event, "se")}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center text-sm text-zinc-400">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 text-xl">
              ✶
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-100">
                Start a new CITRAPORT canvas
              </p>
              <p className="text-xs text-zinc-500">
                Drop an image here or use the Upload button in the top bar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
