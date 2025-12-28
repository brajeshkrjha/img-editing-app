"use client";

import type { ChangeEvent, RefObject } from "react";

type EditorHeaderProps = {
  canReset: boolean;
  onRequestReset: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUndo: () => void;
  onSave: () => void;
  onDownload: () => void;
  hasHistory: boolean;
  isSaveDisabled: boolean;
  isDownloadDisabled: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
};

export function EditorHeader({
  canReset,
  onRequestReset,
  onFileChange,
  onUndo,
  onSave,
  onDownload,
  hasHistory,
  isSaveDisabled,
  isDownloadDisabled,
  fileInputRef,
}: EditorHeaderProps) {
  return (
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
          onClick={onRequestReset}
          disabled={!canReset}
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
            onChange={onFileChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        <button
          type="button"
          onClick={onUndo}
          disabled={!hasHistory}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-sm shadow-black/30 transition hover:border-zinc-600 hover:bg-zinc-900/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-[11px]">↺</span>
          <span>Undo</span>
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaveDisabled}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 shadow-sm shadow-black/30 transition hover:border-emerald-400 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-500"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Save</span>
        </button>

        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloadDisabled}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm shadow-black/30 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-900/10 text-[11px]">
            ⭳
          </span>
          <span>Download</span>
        </button>
      </div>
    </header>
  );
}
