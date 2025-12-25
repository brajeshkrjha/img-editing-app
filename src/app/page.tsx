"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useRef, useState } from "react";

type ToolId = "crop" | "title";

type TitlePreset = "medium" | "center" | "overlay";

type NormalizedPoint = {
  x: number;
  y: number;
};

type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ToolButtonProps = {
  id: ToolId;
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
};

function clamp(value: number, min: number, max: number) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function ToolButton({
  label,
  isActive,
  onClick,
  children,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-zinc-800 text-zinc-50 shadow-[0_0_0_1px_rgba(250,250,250,0.12)]"
          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
      ].join(" ")}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-200 shadow-sm shadow-black/40">
        {children}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [activeTool, setActiveTool] = useState<ToolId>("title");
  const [titlePreset, setTitlePreset] = useState<TitlePreset>("medium");
  const [titlePosition, setTitlePosition] = useState<NormalizedPoint>({
    x: 0.5,
    y: 0.82,
  });
  const [cropRect, setCropRect] = useState<NormalizedRect | null>(null);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragModeRef = useRef<"title" | "crop-move" | "crop-resize" | null>(
    null,
  );
  const dragHandleRef = useRef<"nw" | "ne" | "sw" | "se" | null>(null);
  const dragStartPointerRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartTitleRef = useRef<NormalizedPoint | null>(null);
  const dragStartCropRef = useRef<NormalizedRect | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setCropRect(null);
    setTitlePosition({
      x: 0.5,
      y: 0.82,
    });
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
  }

  function handleTitlePresetChange(next: TitlePreset) {
    setTitlePreset(next);
  }

  function handleTitlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!previewRef.current) {
      return;
    }
    setActiveTool("title");
    dragModeRef.current = "title";
    dragHandleRef.current = null;
    dragStartPointerRef.current = { x: event.clientX, y: event.clientY };
    dragStartTitleRef.current = titlePosition;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function handleCropPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    handle: "move" | "nw" | "ne" | "sw" | "se",
  ) {
    if (!previewRef.current || !cropRect) {
      return;
    }
    setActiveTool("crop");
    dragStartPointerRef.current = { x: event.clientX, y: event.clientY };
    dragStartCropRef.current = cropRect;
    if (handle === "move") {
      dragModeRef.current = "crop-move";
      dragHandleRef.current = null;
    } else {
      dragModeRef.current = "crop-resize";
      dragHandleRef.current = handle;
    }
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function handleCropPreset(aspect: "1:1" | "4:5" | "16:9") {
    if (!cropRect) {
      setCropRect({
        x: 0.08,
        y: 0.08,
        width: 0.84,
        height: 0.84,
      });
      return;
    }
    const centerX = cropRect.x + cropRect.width / 2;
    const centerY = cropRect.y + cropRect.height / 2;
    let width = cropRect.width;
    let height = cropRect.height;
    let targetAspect = 1;

    if (aspect === "4:5") {
      targetAspect = 4 / 5;
    } else if (aspect === "16:9") {
      targetAspect = 16 / 9;
    }

    const currentAspect = width / height;

    if (currentAspect > targetAspect) {
      width = height * targetAspect;
    } else {
      height = width / targetAspect;
    }

    width = clamp(width, 0.2, 1);
    height = clamp(height, 0.2, 1);

    let x = centerX - width / 2;
    let y = centerY - height / 2;

    x = clamp(x, 0, 1 - width);
    y = clamp(y, 0, 1 - height);

    setCropRect({
      x,
      y,
      width,
      height,
    });
  }

  function handlePreviewPointerMove(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (!previewRef.current || !dragStartPointerRef.current) {
      return;
    }
    const rect = previewRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    const dx = (event.clientX - dragStartPointerRef.current.x) / rect.width;
    const dy = (event.clientY - dragStartPointerRef.current.y) / rect.height;

    if (dragModeRef.current === "title" && dragStartTitleRef.current) {
      const nextX = clamp(dragStartTitleRef.current.x + dx, 0.05, 0.95);
      const nextY = clamp(dragStartTitleRef.current.y + dy, 0.05, 0.95);
      setTitlePosition({
        x: nextX,
        y: nextY,
      });
    }

    if (dragModeRef.current === "crop-move" && dragStartCropRef.current) {
      const { width, height } = dragStartCropRef.current;
      const nextX = clamp(
        dragStartCropRef.current.x + dx,
        0,
        Math.max(0, 1 - width),
      );
      const nextY = clamp(
        dragStartCropRef.current.y + dy,
        0,
        Math.max(0, 1 - height),
      );
      setCropRect({
        x: nextX,
        y: nextY,
        width,
        height,
      });
    }

    if (dragModeRef.current === "crop-resize" && dragStartCropRef.current) {
      const handle = dragHandleRef.current;
      if (!handle) {
        return;
      }
      let { x, y, width, height } = dragStartCropRef.current;
      const minSize = 0.15;

      if (handle === "nw") {
        const nextX = clamp(x + dx, 0, x + width - minSize);
        const nextY = clamp(y + dy, 0, y + height - minSize);
        width = width + (x - nextX);
        height = height + (y - nextY);
        x = nextX;
        y = nextY;
      } else if (handle === "ne") {
        const nextWidth = clamp(width + dx, minSize, 1 - x);
        const nextY = clamp(y + dy, 0, y + height - minSize);
        height = height + (y - nextY);
        y = nextY;
        width = nextWidth;
      } else if (handle === "sw") {
        const nextX = clamp(x + dx, 0, x + width - minSize);
        const nextHeight = clamp(height + dy, minSize, 1 - y);
        width = width + (x - nextX);
        x = nextX;
        height = nextHeight;
      } else if (handle === "se") {
        const nextWidth = clamp(width + dx, minSize, 1 - x);
        const nextHeight = clamp(height + dy, minSize, 1 - y);
        width = nextWidth;
        height = nextHeight;
      }

      width = clamp(width, minSize, 1);
      height = clamp(height, minSize, 1);
      x = clamp(x, 0, 1 - width);
      y = clamp(y, 0, 1 - height);

      setCropRect({
        x,
        y,
        width,
        height,
      });
    }
  }

  function handlePreviewPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragModeRef.current) {
      try {
        (event.currentTarget as HTMLElement).releasePointerCapture(
          event.pointerId,
        );
      } catch {
      }
    }
    dragModeRef.current = null;
    dragHandleRef.current = null;
    dragStartPointerRef.current = null;
    dragStartTitleRef.current = null;
    dragStartCropRef.current = null;
  }

  async function handleDownload() {
    if (!imageUrl) {
      return;
    }

    const image = new Image();
    image.src = imageUrl;

    await new Promise((resolve) => {
      if (image.complete) {
        resolve(null);
        return;
      }
      image.onload = () => resolve(null);
      image.onerror = () => resolve(null);
    });

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;

    if (!width || !height) {
      return;
    }

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = width;
    let sourceHeight = height;

    if (cropRect) {
      const cropX = clamp(cropRect.x, 0, 1);
      const cropY = clamp(cropRect.y, 0, 1);
      const cropWidth = clamp(cropRect.width, 0, 1 - cropX);
      const cropHeight = clamp(cropRect.height, 0, 1 - cropY);
      sourceX = Math.round(cropX * width);
      sourceY = Math.round(cropY * height);
      sourceWidth = Math.max(1, Math.round(cropWidth * width));
      sourceHeight = Math.max(1, Math.round(cropHeight * height));
    }

    const canvas = document.createElement("canvas");
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight,
    );

    const trimmedTitle = title.trim();

    if (trimmedTitle) {
      const base = sourceWidth;
      let fontSize = Math.max(16, Math.round(base * 0.045));

      if (titlePreset === "center") {
        fontSize = Math.round(fontSize * 1.15);
      } else if (titlePreset === "overlay") {
        fontSize = Math.round(fontSize * 1.05);
      }

      const verticalPadding = Math.max(8, Math.round(base * 0.016));
      const horizontalPadding = Math.max(16, Math.round(base * 0.04));

      context.font = `${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      context.textBaseline = "middle";
      context.textAlign = "center";

      const metrics = context.measureText(trimmedTitle);
      const textWidth = metrics.width;
      const textHeight =
        (metrics.actualBoundingBoxAscent || fontSize * 0.8) +
        (metrics.actualBoundingBoxDescent || fontSize * 0.2);

      const boxWidth = textWidth + horizontalPadding * 2;
      const boxHeight = textHeight + verticalPadding * 2;

      let centerX = clamp(titlePosition.x, 0.05, 0.95);
      let centerY = clamp(titlePosition.y, 0.05, 0.95);

      if (cropRect) {
        const cropX = clamp(cropRect.x, 0, 1);
        const cropY = clamp(cropRect.y, 0, 1);
        const cropWidth = clamp(cropRect.width, 0.01, 1);
        const cropHeight = clamp(cropRect.height, 0.01, 1);
        const withinX = (centerX - cropX) / cropWidth;
        const withinY = (centerY - cropY) / cropHeight;
        if (
          withinX < 0 ||
          withinX > 1 ||
          withinY < 0 ||
          withinY > 1
        ) {
          canvas.toDataURL();
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = "edited-image.png";
          link.click();
          return;
        }
        centerX = clamp(withinX, 0.05, 0.95);
        centerY = clamp(withinY, 0.05, 0.95);
      }

      const textX = centerX * sourceWidth;
      const textY = centerY * sourceHeight;

      const boxX = textX - boxWidth / 2;
      const boxY = textY - boxHeight / 2;

      if (titlePreset === "overlay") {
        context.fillStyle = "rgba(15, 23, 42, 0.95)";
      } else {
        context.fillStyle = "rgba(0, 0, 0, 0.7)";
      }
      context.fillRect(boxX, boxY, boxWidth, boxHeight);

      context.fillStyle = "#ffffff";
      context.fillText(trimmedTitle, textX, textY);
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "edited-image.png";
    link.click();
  }

  const previewBaseClassName =
    "relative flex h-[480px] w-full max-w-3xl items-center justify-center overflow-hidden";
  const previewClassName = imageUrl
    ? previewBaseClassName
    : [
        previewBaseClassName,
        "rounded-2xl border border-zinc-800/80 bg-[radial-gradient(circle_at_top,_rgba(250,250,250,0.08),transparent_55%),radial-gradient(circle_at_bottom,_rgba(24,24,27,0.9),#020617)] shadow-[0_18px_45px_rgba(0,0,0,0.7)]",
      ].join(" ");

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-50">
      <aside className="flex w-64 flex-col border-r border-zinc-800/80 bg-zinc-950/80 px-4 py-5 backdrop-blur">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-900 shadow shadow-black/40">
            <span className="text-sm font-bold tracking-tight">IE</span>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Image Editor</p>
            <p className="text-xs text-zinc-500">Workspace</p>
          </div>
        </div>

        <div className="mt-6 space-y-1 px-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          <p>Tools</p>
        </div>

        <nav className="mt-2 space-y-2 px-1">
          <ToolButton
            id="crop"
            label="Crop"
            isActive={activeTool === "crop"}
            onClick={() => setActiveTool("crop")}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-zinc-500/80">
              <span className="h-2 w-2 border border-zinc-300/80" />
            </span>
          </ToolButton>

          <ToolButton
            id="title"
            label="Title"
            isActive={activeTool === "title"}
            onClick={() => setActiveTool("title")}
          >
            <span className="text-base font-semibold leading-none">T</span>
          </ToolButton>
        </nav>

        <div className="mt-auto space-y-2 px-1 pb-1 pt-6 text-xs text-zinc-500">
          <p className="text-[10px] uppercase tracking-[0.16em]">Session</p>
          <div className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2 text-[11px]">
            <span className="text-zinc-400">Unsaved draft</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-8 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-zinc-800/90 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300">
              Canvas
            </div>
            <p className="text-xs text-zinc-500">
              Upload an image and start editing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-sm shadow-black/30 transition hover:border-zinc-500 hover:bg-zinc-900">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-md bg-zinc-800 text-[11px] text-zinc-100">
                ↑
              </span>
              <span>Upload image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!imageUrl}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm shadow-black/30 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-900/10 text-[11px]">
                ⭳
              </span>
              <span>Download</span>
            </button>
          </div>
        </header>

        <section className="flex flex-1 gap-6 px-8 py-6">
          <div className="flex flex-1 items-center justify-center">
            <div
              ref={previewRef}
              className={previewClassName}
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerLeave={handlePreviewPointerUp}
            >
              {imageUrl ? (
                <div className="relative flex h-full w-full items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Preview"
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
                      onPointerDown={handleTitlePointerDown}
                    >
                      <div
                        className={[
                          "inline-flex max-w-xl items-center justify-center rounded-full backdrop-blur shadow-[0_6px_18px_rgba(0,0,0,0.6)]",
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
                        <span className="truncate">{title}</span>
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
                        onPointerDown={(event) =>
                          handleCropPointerDown(event, "move")
                        }
                      >
                        <div
                          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400 bg-zinc-950"
                          style={{
                            left: "0%",
                            top: "0%",
                          }}
                          onPointerDown={(event) =>
                            handleCropPointerDown(event, "nw")
                          }
                        />
                        <div
                          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400 bg-zinc-950"
                          style={{
                            left: "100%",
                            top: "0%",
                          }}
                          onPointerDown={(event) =>
                            handleCropPointerDown(event, "ne")
                          }
                        />
                        <div
                          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400 bg-zinc-950"
                          style={{
                            left: "0%",
                            top: "100%",
                          }}
                          onPointerDown={(event) =>
                            handleCropPointerDown(event, "sw")
                          }
                        />
                        <div
                          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400 bg-zinc-950"
                          style={{
                            left: "100%",
                            top: "100%",
                          }}
                          onPointerDown={(event) =>
                            handleCropPointerDown(event, "se")
                          }
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
                      Drop an image to begin
                    </p>
                    <p className="text-xs text-zinc-500">
                      Or use the Upload button in the top bar.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="flex w-80 flex-col gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {activeTool === "crop" ? "Crop" : "Title"}
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
                  <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Add a caption or headline"
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
                          onClick={() => handleTitlePresetChange(preset)}
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

                <div className="space-y-1.5 text-[11px] text-zinc-400">
                  <p className="text-xs font-medium text-zinc-300">
                    Hints
                  </p>
                  <p>
                    Keep titles short and clear. They will appear as an overlay
                    near the bottom of your image.
                  </p>
                </div>
              </div>
            )}

            {activeTool === "crop" && (
              <div className="space-y-4 text-xs text-zinc-400">
                <p>
                  Crop controls will let you focus on the most important part of
                  your image. You will be able to adjust the visible region
                  directly on the canvas.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCropPreset("1:1")}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-center text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900/90 hover:text-zinc-100"
                  >
                    1:1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCropPreset("4:5")}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-center text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900/90 hover:text-zinc-100"
                  >
                    4:5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCropPreset("16:9")}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-center text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900/90 hover:text-zinc-100"
                  >
                    16:9
                  </button>
                </div>
                <p className="text-[11px]">
                  For now, use the full image. Cropping logic will be wired into
                  this panel next.
                </p>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
