"use client";

import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ToolId = "crop" | "title" | null;

type TitlePreset = "medium" | "center" | "overlay";

type DownloadFormat = "png" | "jpeg";

type TitleSizeLevel = 0 | 1 | 2;

type TitleWeight = "regular" | "bold";

type TitleColor = "white" | "black" | "accent";

type TitleAlign = "left" | "center" | "right";

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

type EditorSnapshot = {
  title: string;
  titlePreset: TitlePreset;
  titlePosition: NormalizedPoint;
  cropRect: NormalizedRect | null;
  downloadName: string;
  downloadFormat: DownloadFormat;
  titleSizeLevel: TitleSizeLevel;
  titleWeight: TitleWeight;
  titleColor: TitleColor;
  titleAlign: TitleAlign;
};

type PersistedSession = {
  imageDataUrl: string | null;
  originalFileName: string | null;
  snapshot: EditorSnapshot | null;
};

const PERSIST_KEY = "img-ed/session-v1";

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
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");
  const [downloadFormat, setDownloadFormat] =
    useState<DownloadFormat>("png");
  const [title, setTitle] = useState("");
  const [activeTool, setActiveTool] = useState<ToolId>(null);
  const [titlePreset, setTitlePreset] = useState<TitlePreset>("medium");
  const [titleSizeLevel, setTitleSizeLevel] = useState<TitleSizeLevel>(1);
  const [titleWeight, setTitleWeight] = useState<TitleWeight>("bold");
  const [titleColor, setTitleColor] = useState<TitleColor>("white");
  const [titleAlign, setTitleAlign] = useState<TitleAlign>("center");
  const [titlePosition, setTitlePosition] = useState<NormalizedPoint>({
    x: 0.5,
    y: 0.82,
  });
  const [cropRect, setCropRect] = useState<NormalizedRect | null>(null);
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [lastSavedSnapshot, setLastSavedSnapshot] =
    useState<EditorSnapshot | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [hasHydratedSession, setHasHydratedSession] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragModeRef = useRef<"title" | "crop-move" | "crop-resize" | null>(
    null,
  );
  const dragHandleRef = useRef<"nw" | "ne" | "sw" | "se" | null>(null);
  const dragStartPointerRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartTitleRef = useRef<NormalizedPoint | null>(null);
  const dragStartCropRef = useRef<NormalizedRect | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem(PERSIST_KEY);
      if (!raw) {
        setHasHydratedSession(true);
        return;
      }
      const data = JSON.parse(raw) as PersistedSession;
      if (data.imageDataUrl) {
        setImageUrl(data.imageDataUrl);
      }
      if (data.originalFileName) {
        setOriginalFileName(data.originalFileName);
      }
      if (data.snapshot) {
        applySnapshot(data.snapshot);
        setLastSavedSnapshot(data.snapshot);
      }
      setHistory([]);
      setHasUnsavedChanges(false);
      setBannerMessage(null);
    } catch {
    } finally {
      setHasHydratedSession(true);
    }
  }, []);

  function createSnapshot(): EditorSnapshot {
    return {
      title,
      titlePreset,
      titlePosition,
      cropRect,
      downloadName,
      downloadFormat,
      titleSizeLevel,
      titleWeight,
      titleColor,
      titleAlign,
    };
  }

  function applySnapshot(snapshot: EditorSnapshot) {
    setTitle(snapshot.title);
    setTitlePreset(snapshot.titlePreset);
    setTitlePosition(snapshot.titlePosition);
    setCropRect(snapshot.cropRect);
    setDownloadName(snapshot.downloadName);
    setDownloadFormat(snapshot.downloadFormat);
    setTitleSizeLevel(snapshot.titleSizeLevel);
    setTitleWeight(snapshot.titleWeight);
    setTitleColor(snapshot.titleColor);
    setTitleAlign(snapshot.titleAlign);
  }

  function pushHistory() {
    const snapshot = createSnapshot();
    setHistory((prev) => {
      const next = [...prev, snapshot];
      if (next.length > 50) {
        next.shift();
      }
      return next;
    });
    setHasUnsavedChanges(true);
    setBannerMessage(null);
  }

  function handleUndo() {
    setHistory((prev) => {
      if (!prev.length) {
        return prev;
      }
      const next = prev.slice(0, prev.length - 1);
      const snapshot = prev[prev.length - 1];
      applySnapshot(snapshot);
      if (
        lastSavedSnapshot &&
        JSON.stringify(snapshot) === JSON.stringify(lastSavedSnapshot)
      ) {
        setHasUnsavedChanges(false);
      } else {
        setHasUnsavedChanges(true);
      }
      setBannerMessage(null);
      return next;
    });
  }

  function handleSave() {
    if (!imageUrl) {
      setBannerMessage("Upload an image before saving.");
      return;
    }
    const snapshot = createSnapshot();
    setLastSavedSnapshot(snapshot);
    setHasUnsavedChanges(false);
    setBannerMessage("All changes saved.");
  }

  function handlePreviewDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handlePreviewDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (
      event.dataTransfer &&
      Array.from(event.dataTransfer.types).includes("Files")
    ) {
      setIsDraggingFile(true);
    }
  }

  function handlePreviewDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const related = event.relatedTarget as Node | null;
    if (!related || !event.currentTarget.contains(related)) {
      setIsDraggingFile(false);
    }
  }

  function handlePreviewDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    const files = event.dataTransfer?.files;
    if (!files || !files.length) {
      return;
    }
    const file = files[0];
    loadFile(file);
  }

  function baseNameFromFileName(name: string) {
    const lastDot = name.lastIndexOf(".");
    if (lastDot <= 0) return name;
    return name.slice(0, lastDot);
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!hasHydratedSession) {
      return;
    }
    const payload: PersistedSession = {
      imageDataUrl: imageUrl,
      originalFileName,
      snapshot: imageUrl ? createSnapshot() : null,
    };
    try {
      window.localStorage.setItem(PERSIST_KEY, JSON.stringify(payload));
    } catch {
    }
  }, [
    hasHydratedSession,
    imageUrl,
    originalFileName,
    title,
    titlePreset,
    titlePosition,
    cropRect,
    downloadName,
    downloadFormat,
    titleSizeLevel,
    titleWeight,
    titleColor,
    titleAlign,
  ]);

  function loadFile(file: File | null | undefined) {
    if (!file) {
      setImageUrl(null);
      setOriginalFileName(null);
      setDownloadName("");
      setHistory([]);
      setLastSavedSnapshot(null);
      setHasUnsavedChanges(false);
      setBannerMessage(null);
      return;
    }
    if (file.type && !file.type.startsWith("image/")) {
      setBannerMessage("Please upload an image file.");
      return;
    }
    setHistory([]);
    setLastSavedSnapshot(null);
    setHasUnsavedChanges(false);
    setBannerMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        return;
      }
      setImageUrl(reader.result);
      setOriginalFileName(file.name);
      setDownloadName(baseNameFromFileName(file.name));
      setCropRect(null);
      setTitlePosition({
        x: 0.5,
        y: 0.82,
      });
    };
    reader.readAsDataURL(file);
  }

  function handleRequestReset() {
    if (
      !imageUrl &&
      !title &&
      !cropRect &&
      !downloadName &&
      !history.length
    ) {
      return;
    }
    setIsResetDialogOpen(true);
  }

  function handleConfirmReset() {
    setIsResetDialogOpen(false);
    loadFile(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(PERSIST_KEY);
      } catch {
      }
    }
  }

  function handleCancelReset() {
    setIsResetDialogOpen(false);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    loadFile(file);
  }

  function handleDownloadNameChange(event: ChangeEvent<HTMLInputElement>) {
    pushHistory();
    setDownloadName(event.target.value);
  }

  function handleDownloadFormatChange(format: DownloadFormat) {
    if (format === downloadFormat) {
      return;
    }
    pushHistory();
    setDownloadFormat(format);
  }

  function handleTitleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    pushHistory();
    setTitle(event.target.value);
  }

  function handleTitlePresetChange(next: TitlePreset) {
    if (next === titlePreset) {
      return;
    }
    pushHistory();
    setTitlePreset(next);
  }

  function handleTitleSizeLevelChange(level: TitleSizeLevel) {
    if (level === titleSizeLevel) {
      return;
    }
    pushHistory();
    setTitleSizeLevel(level);
  }

  function handleTitleWeightChange(weight: TitleWeight) {
    if (weight === titleWeight) {
      return;
    }
    pushHistory();
    setTitleWeight(weight);
  }

  function handleTitleColorChange(color: TitleColor) {
    if (color === titleColor) {
      return;
    }
    pushHistory();
    setTitleColor(color);
  }

  function handleTitleAlignChange(align: TitleAlign) {
    if (align === titleAlign) {
      return;
    }
    pushHistory();
    setTitleAlign(align);
  }

  function handleTitlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!previewRef.current) {
      return;
    }
    pushHistory();
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
    pushHistory();
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
      pushHistory();
      setCropRect({
        x: 0.08,
        y: 0.08,
        width: 0.84,
        height: 0.84,
      });
      return;
    }
    pushHistory();
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

    if (hasUnsavedChanges) {
      setBannerMessage("You have unsaved changes. Save before downloading.");
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
      const base = Math.min(sourceWidth, sourceHeight);
      let fontSize = Math.max(14, Math.round(base * 0.018));

      const presetMultiplier =
        titlePreset === "center"
          ? 1.1
          : titlePreset === "overlay"
          ? 1.05
          : 1;

      const sizeMultiplier =
        titleSizeLevel === 0 ? 0.9 : titleSizeLevel === 2 ? 1.15 : 1;

      fontSize = Math.round(fontSize * presetMultiplier * sizeMultiplier);

      const verticalPadding = Math.max(8, Math.round(fontSize * 0.7));
      const horizontalPadding = Math.max(16, Math.round(fontSize * 1.8));

      const fontWeightValue = titleWeight === "bold" ? 600 : 400;
      context.font = `${fontWeightValue} ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      context.textBaseline = "middle";

      if (titleAlign === "left") {
        context.textAlign = "left";
      } else if (titleAlign === "right") {
        context.textAlign = "right";
      } else {
        context.textAlign = "center";
      }

      const lines = trimmedTitle.split(/\r?\n/);
      const lineHeight = Math.round(fontSize * 1.3);

      let maxLineWidth = 0;
      for (const line of lines) {
        const metrics = context.measureText(line);
        if (metrics.width > maxLineWidth) {
          maxLineWidth = metrics.width;
        }
      }

      const totalTextHeight = lineHeight * lines.length;

      const boxWidth = maxLineWidth + horizontalPadding * 2;
      const boxHeight = totalTextHeight + verticalPadding * 2;

      let centerX = clamp(titlePosition.x, 0.05, 0.95);
      let centerY = clamp(titlePosition.y, 0.05, 0.95);

      if (cropRect) {
        const cropX = clamp(cropRect.x, 0, 1);
        const cropY = clamp(cropRect.y, 0, 1);
        const cropWidth = clamp(cropRect.width, 0.01, 1);
        const cropHeight = clamp(cropRect.height, 0.01, 1);
        const withinX = (centerX - cropX) / cropWidth;
        const withinY = (centerY - cropY) / cropHeight;
        if (withinX < 0 || withinX > 1 || withinY < 0 || withinY > 1) {
          context.fillStyle = "#000000";
          context.fillRect(0, 0, sourceWidth, sourceHeight);
          const baseFromOriginal = originalFileName
            ? baseNameFromFileName(originalFileName)
            : "edited-image";
          const finalBaseName =
            downloadName.trim() !== "" ? downloadName.trim() : baseFromOriginal;
          const mimeType =
            downloadFormat === "jpeg" ? "image/jpeg" : "image/png";
          const extension = downloadFormat === "jpeg" ? "jpg" : "png";
          const link = document.createElement("a");
          link.href = canvas.toDataURL(mimeType);
          link.download = `${finalBaseName}.${extension}`;
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
        context.fillStyle = "rgba(24, 24, 27, 0.9)";
      } else {
        context.fillStyle = "rgba(0, 0, 0, 0.75)";
      }
      context.fillRect(boxX, boxY, boxWidth, boxHeight);

      let textColor = "#ffffff";
      if (titleColor === "black") {
        textColor = "#020617";
      } else if (titleColor === "accent") {
        textColor = "#22c55e";
      }
      context.fillStyle = textColor;

      const firstLineY =
        textY - totalTextHeight / 2 + lineHeight * 0.5;
      lines.forEach((line, index) => {
        const lineY = firstLineY + index * lineHeight;
        context.fillText(line, textX, lineY);
      });
    }

    const baseFromOriginal = originalFileName
      ? baseNameFromFileName(originalFileName)
      : "edited-image";
    const finalBaseName =
      downloadName.trim() !== "" ? downloadName.trim() : baseFromOriginal;

    const mimeType = downloadFormat === "jpeg" ? "image/jpeg" : "image/png";
    const extension = downloadFormat === "jpeg" ? "jpg" : "png";

    const link = document.createElement("a");
    link.href = canvas.toDataURL(mimeType);
    link.download = `${finalBaseName}.${extension}`;
    link.click();
  }

  const previewBaseClassName =
    "relative flex h-[320px] sm:h-[400px] lg:h-[480px] w-full max-w-3xl items-center justify-center overflow-hidden";
  const previewClassName = imageUrl
    ? previewBaseClassName
    : [
        previewBaseClassName,
        "cursor-pointer rounded-2xl border border-zinc-800/80 bg-[radial-gradient(circle_at_top,_rgba(250,250,250,0.08),transparent_55%),radial-gradient(circle_at_bottom,_rgba(24,24,27,0.9),#020617)] shadow-[0_18px_45px_rgba(0,0,0,0.7)]",
        isDraggingFile &&
          "border-emerald-400/80 shadow-[0_0_0_1px_rgba(52,211,153,0.7)]",
      ]
        .filter(Boolean)
        .join(" ");

  return (
    <main className="flex min-h-screen flex-col md:flex-row bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-50">
      <aside className="order-2 md:order-1 flex w-full md:w-64 flex-col border-b md:border-b-0 md:border-r border-zinc-800/80 bg-zinc-950/80 px-3 py-3 sm:px-4 sm:py-5 backdrop-blur">
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

      <div className="order-1 md:order-2 flex flex-1 flex-col">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-3 sm:px-6 sm:py-4 lg:px-8 backdrop-blur">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="rounded-full border border-zinc-800/90 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300">
              Canvas
            </div>
            <p className="text-xs text-zinc-500">
              Upload an image and start editing.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={handleRequestReset}
              disabled={
                !imageUrl &&
                !title &&
                !cropRect &&
                !downloadName &&
                !history.length
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 shadow-sm shadow-black/30 transition hover:border-red-500/70 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="text-[11px]">✕</span>
              <span>Reset</span>
            </button>

            <label className="relative inline-flex cursor-pointer items-center overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-sm shadow-black/30 transition hover:border-zinc-500 hover:bg-zinc-900">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-md bg-zinc-800 text-[11px] text-zinc-100">
                ↑
              </span>
              <span>Upload image</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>

            <button
              type="button"
              onClick={handleUndo}
              disabled={!history.length}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-sm shadow-black/30 transition hover:border-zinc-600 hover:bg-zinc-900/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-[11px]">↺</span>
              <span>Undo</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!imageUrl || !hasUnsavedChanges}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 shadow-sm shadow-black/30 transition hover:border-emerald-400 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-500"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Save</span>
            </button>

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

        {bannerMessage && (
          <div className="border-b border-zinc-800/80 bg-zinc-900/80 px-8 py-2 text-xs text-zinc-300">
            {bannerMessage}
          </div>
        )}

        <section className="flex flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:px-8">
          <div className="flex flex-1 items-center justify-center">
            <div
              ref={previewRef}
              className={previewClassName}
              onDragOver={handlePreviewDragOver}
              onDragEnter={handlePreviewDragEnter}
              onDragLeave={handlePreviewDragLeave}
              onDrop={handlePreviewDrop}
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerLeave={handlePreviewPointerUp}
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
                    onChange={handleTitleChange}
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
                          handleTitleSizeLevelChange(
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
                          onClick={() => handleTitleWeightChange(weight)}
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
                              onClick={() => handleTitleAlignChange(align)}
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
                              onClick={() => handleTitleColorChange(color)}
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
                      Use line breaks to create multi-line titles and drag the
                      pill on the canvas to position it.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTool === "crop" && (
              <div className="space-y-4 text-xs text-zinc-400">
                <p>
                  Crop controls will let you focus on the most important part of
                  your image. Adjust the visible region directly on the canvas.
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
                    onChange={handleDownloadNameChange}
                    placeholder={
                      originalFileName
                        ? baseNameFromFileName(originalFileName)
                        : "edited-image"
                    }
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
                          onClick={() => handleDownloadFormatChange(format)}
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
                  PNG keeps transparency and crisp text. JPG is smaller and good
                  for photos.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
      {isResetDialogOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
          onClick={handleCancelReset}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-medium text-zinc-100">
              Reset workspace?
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              This will remove the current image, title, crop, and export
              settings and return you to a blank canvas.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelReset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-sm shadow-black/30 transition hover:border-zinc-500 hover:bg-zinc-900/80"
              >
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/70 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 shadow-sm shadow-black/40 transition hover:border-red-400 hover:bg-red-500/20"
              >
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
