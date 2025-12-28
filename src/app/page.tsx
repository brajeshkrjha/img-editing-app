"use client";

import type { ChangeEvent, DragEvent, PointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  DownloadFormat,
  EditorSnapshot,
  NormalizedPoint,
  NormalizedRect,
  TitleAlign,
  TitleColor,
  TitlePreset,
  TitleSizeLevel,
  TitleWeight,
  ToolId,
} from "./editor/types";
import { ToolSidebar } from "./editor/ToolSidebar";
import { EditorHeader } from "./editor/EditorHeader";
import { EditorCanvas } from "./editor/EditorCanvas";
import { EditorRightPanel } from "./editor/EditorRightPanel";

type PersistedSession = {
  imageDataUrl: string | null;
  originalFileName: string | null;
  snapshot: EditorSnapshot | null;
};

const PERSIST_KEY = "img-ed/session-v1";

function clamp(value: number, min: number, max: number) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export default function Home() {
  const searchParams = useSearchParams();
  const sharedSessionId = searchParams.get("session");
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
    if (sharedSessionId) {
      let cancelled = false;
      const loadSharedSession = async () => {
        try {
          const response = await fetch(`/api/sessions/${sharedSessionId}`);
          if (!response.ok) {
            setHasHydratedSession(true);
            return;
          }
          const data = (await response.json()) as {
            imageDataUrl: string | null;
            originalFileName: string | null;
            snapshot: EditorSnapshot | null;
          };
          if (cancelled) {
            return;
          }
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
          if (!cancelled) {
            setHasHydratedSession(true);
          }
        }
      };
      loadSharedSession();
      return () => {
        cancelled = true;
      };
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
  }, [sharedSessionId]);

  const createSnapshot = useCallback(
    (): EditorSnapshot => ({
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
    }),
    [
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
    ],
  );

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
  }, [hasHydratedSession, imageUrl, originalFileName, createSnapshot]);

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

  function handleTitlePointerDown(event: PointerEvent<HTMLDivElement>) {
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
    event: PointerEvent<HTMLDivElement>,
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
    event: PointerEvent<HTMLDivElement>,
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

  function handlePreviewPointerUp(event: PointerEvent<HTMLDivElement>) {
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

  async function handleShare() {
    if (!imageUrl) {
      setBannerMessage("Upload an image before sharing.");
      return;
    }
    const snapshot = createSnapshot();
    setBannerMessage("Creating share link...");
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageDataUrl: imageUrl,
          originalFileName,
          snapshot,
          isTemplate: false,
          isPublic: true,
        }),
      });
      if (!response.ok) {
        setBannerMessage("Unable to create share link. Please try again.");
        return;
      }
      const data = (await response.json()) as { id: string };
      if (!data.id) {
        setBannerMessage("Unable to create share link. Please try again.");
        return;
      }
      const origin =
        typeof window !== "undefined" && window.location
          ? window.location.origin
          : "";
      const shareUrl = origin ? `${origin}?session=${data.id}` : `?session=${data.id}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setBannerMessage("Share link copied to clipboard.");
          return;
        } catch {
        }
      }
      setBannerMessage("Share link ready. Copy it from the address bar.");
    } catch {
      setBannerMessage("Unable to create share link. Please try again.");
    }
  }

  const canReset =
    !!(
      imageUrl ||
      title ||
      cropRect ||
      downloadName ||
      history.length
    );

  const downloadNamePlaceholder =
    originalFileName ? baseNameFromFileName(originalFileName) : "edited-image";

  return (
    <main className="flex min-h-screen flex-col md:flex-row bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-50">
      <ToolSidebar activeTool={activeTool} onToolChange={setActiveTool} />

      <div className="order-1 md:order-2 flex flex-1 flex-col">
        <EditorHeader
          canReset={canReset}
          onRequestReset={handleRequestReset}
          onFileChange={handleFileChange}
          onUndo={handleUndo}
          onSave={handleSave}
          onDownload={handleDownload}
          hasHistory={history.length > 0}
          isSaveDisabled={!imageUrl || !hasUnsavedChanges}
          isDownloadDisabled={!imageUrl}
          onShare={handleShare}
          isShareDisabled={!imageUrl}
          fileInputRef={fileInputRef}
        />

        {bannerMessage && (
          <div className="border-b border-zinc-800/80 bg-zinc-900/80 px-8 py-2 text-xs text-zinc-300">
            {bannerMessage}
          </div>
        )}

        <section className="flex flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:px-8">
          <EditorCanvas
            imageUrl={imageUrl}
            title={title}
            titlePreset={titlePreset}
            titlePosition={titlePosition}
            titleAlign={titleAlign}
            titleSizeLevel={titleSizeLevel}
            titleWeight={titleWeight}
            titleColor={titleColor}
            cropRect={cropRect}
            isDraggingFile={isDraggingFile}
            previewRef={previewRef}
            fileInputRef={fileInputRef}
            onPreviewDragOver={handlePreviewDragOver}
            onPreviewDragEnter={handlePreviewDragEnter}
            onPreviewDragLeave={handlePreviewDragLeave}
            onPreviewDrop={handlePreviewDrop}
            onPreviewPointerMove={handlePreviewPointerMove}
            onPreviewPointerUp={handlePreviewPointerUp}
            onTitlePointerDown={handleTitlePointerDown}
            onCropPointerDown={handleCropPointerDown}
          />

          <EditorRightPanel
            activeTool={activeTool}
            title={title}
            titlePreset={titlePreset}
            titleSizeLevel={titleSizeLevel}
            titleWeight={titleWeight}
            titleAlign={titleAlign}
            titleColor={titleColor}
            downloadName={downloadName}
            downloadFormat={downloadFormat}
            downloadNamePlaceholder={downloadNamePlaceholder}
            onTitleChange={handleTitleChange}
            onCropPresetChange={handleCropPreset}
            onTitlePresetChange={handleTitlePresetChange}
            onTitleSizeLevelChange={handleTitleSizeLevelChange}
            onTitleWeightChange={handleTitleWeightChange}
            onTitleAlignChange={handleTitleAlignChange}
            onTitleColorChange={handleTitleColorChange}
            onDownloadNameChange={handleDownloadNameChange}
            onDownloadFormatChange={handleDownloadFormatChange}
          />
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
