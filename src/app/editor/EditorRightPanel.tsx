"use client";

import type { ChangeEvent } from "react";
import type {
  DownloadFormat,
  TitleAlign,
  TitleColor,
  TitlePreset,
  TitleSizeLevel,
  TitleWeight,
  ToolId,
} from "./types";

type EditorRightPanelProps = {
  activeTool: ToolId;
  title: string;
  titlePreset: TitlePreset;
  titleSizeLevel: TitleSizeLevel;
  titleWeight: TitleWeight;
  titleAlign: TitleAlign;
  titleColor: TitleColor;
  downloadName: string;
  downloadFormat: DownloadFormat;
  downloadNamePlaceholder: string;
  onTitleChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onCropPresetChange: (aspect: "1:1" | "4:5" | "16:9") => void;
  onTitlePresetChange: (preset: TitlePreset) => void;
  onTitleSizeLevelChange: (level: TitleSizeLevel) => void;
  onTitleWeightChange: (weight: TitleWeight) => void;
  onTitleAlignChange: (align: TitleAlign) => void;
  onTitleColorChange: (color: TitleColor) => void;
  onDownloadNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDownloadFormatChange: (format: DownloadFormat) => void;
};

export function EditorRightPanel({
  activeTool,
  title,
  titlePreset,
  titleSizeLevel,
  titleWeight,
  titleAlign,
  titleColor,
  downloadName,
  downloadFormat,
  downloadNamePlaceholder,
  onTitleChange,
  onCropPresetChange,
  onTitlePresetChange,
  onTitleSizeLevelChange,
  onTitleWeightChange,
  onTitleAlignChange,
  onTitleColorChange,
  onDownloadNameChange,
  onDownloadFormatChange,
}: EditorRightPanelProps) {
  return (
    <aside className="mt-4 w-full lg:mt-0 lg:w-80 flex flex-col gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {activeTool ? (activeTool === "crop" ? "Crop" : "Title") : "Tools"}
        </p>
        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
          Basic tools
        </span>
      </div>

      {activeTool === "title" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-300">
              Title text
            </p>
            <textarea
              value={title}
              onChange={onTitleChange}
              placeholder="Add a caption or headline (use line breaks if needed)"
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            {(["medium", "center", "overlay"] as TitlePreset[]).map(
              (preset) => {
                const isActive = titlePreset === preset;
                const label =
                  preset === "medium"
                    ? "Medium"
                    : preset === "center"
                    ? "Centered"
                    : "Overlay";
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onTitlePresetChange(preset)}
                    className={[
                      "rounded-lg border px-2 py-1.5 text-center transition",
                      isActive
                        ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900/90 hover:text-zinc-100",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              },
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-300">
                Font size
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={1}
                  value={titleSizeLevel}
                  onChange={(event) =>
                    onTitleSizeLevelChange(
                      Number(event.target.value) as TitleSizeLevel,
                    )
                  }
                  className="flex-1 accent-zinc-100"
                />
                <span className="w-12 text-right text-[11px] text-zinc-400">
                  {titleSizeLevel === 0
                    ? "Small"
                    : titleSizeLevel === 2
                    ? "Large"
                    : "Medium"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {(["regular", "bold"] as TitleWeight[]).map((weight) => {
                const isActive = titleWeight === weight;
                const label = weight === "bold" ? "Bold" : "Regular";
                return (
                  <button
                    key={weight}
                    type="button"
                    onClick={() => onTitleWeightChange(weight)}
                    className={[
                      "rounded-lg border px-2 py-1.5 text-center transition",
                      isActive
                        ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900/90 hover:text-zinc-100",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-300">
                Alignment
              </p>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                {(["left", "center", "right"] as TitleAlign[]).map(
                  (align) => {
                    const isActive = titleAlign === align;
                    const label =
                      align === "left"
                        ? "Left"
                        : align === "right"
                        ? "Right"
                        : "Center";
                    return (
                      <button
                        key={align}
                        type="button"
                        onClick={() => onTitleAlignChange(align)}
                        className={[
                          "rounded-lg border px-2 py-1.5 text-center transition",
                          isActive
                            ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900/90 hover:text-zinc-100",
                        ].join(" ")}
                      >
                        {label}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-300">
                Text color
              </p>
              <div className="flex gap-2">
                {(["white", "black", "accent"] as TitleColor[]).map(
                  (color) => {
                    const isActive = titleColor === color;
                    const label =
                      color === "white"
                        ? "Light"
                        : color === "black"
                        ? "Dark"
                        : "Accent";
                    const swatchClass =
                      color === "white"
                        ? "bg-zinc-50"
                        : color === "black"
                        ? "bg-zinc-900"
                        : "bg-emerald-400";
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onTitleColorChange(color)}
                        className={[
                          "flex flex-1 items-center gap-2 rounded-lg border px-2 py-1.5 text-[11px] transition",
                          isActive
                            ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900/90 hover:text-zinc-100",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "h-3 w-3 rounded-full border border-zinc-700",
                            swatchClass,
                          ].join(" ")}
                        />
                        <span>{label}</span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-zinc-400">
              <p className="text-xs font-medium text-zinc-300">
                Hints
              </p>
              <p>
                Use line breaks to create multi-line titles and drag the pill on
                the canvas to position it.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTool === "crop" && (
        <div className="space-y-4 text-xs text-zinc-400">
          <p>
            Crop controls will let you focus on the most important part of your
            image. Adjust the visible region directly on the canvas.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onCropPresetChange("1:1")}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-center text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900/90 hover:text-zinc-100"
            >
              1:1
            </button>
            <button
              type="button"
              onClick={() => onCropPresetChange("4:5")}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-center text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900/90 hover:text-zinc-100"
            >
              4:5
            </button>
            <button
              type="button"
              onClick={() => onCropPresetChange("16:9")}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-center text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900/90 hover:text-zinc-100"
            >
              16:9
            </button>
          </div>
        </div>
      )}

      <div className="mt-2 space-y-3 border-t border-zinc-800/80 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Export
          </p>
          <span className="text-[10px] text-zinc-500">
            {downloadFormat === "png" ? "PNG" : "JPG"}
          </span>
        </div>
        <div className="space-y-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-300">
              File name
            </p>
            <input
              type="text"
              value={downloadName}
              onChange={onDownloadNameChange}
              placeholder={downloadNamePlaceholder}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-300">
              Format
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {(["png", "jpeg"] as DownloadFormat[]).map((format) => {
                const isActive = downloadFormat === format;
                const label = format === "png" ? "PNG" : "JPG";
                return (
                  <button
                    key={format}
                    type="button"
                    onClick={() => onDownloadFormatChange(format)}
                    className={[
                      "rounded-lg border px-2 py-1.5 text-center transition",
                      isActive
                        ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900/90 hover:text-zinc-100",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-zinc-500">
            PNG keeps transparency and crisp text. JPG is smaller and good for
            photos.
          </p>
        </div>
      </div>
    </aside>
  );
}
