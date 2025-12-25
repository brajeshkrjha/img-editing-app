"use client";

import type { ReactNode } from "react";
import type { ToolId } from "./types";

type ToolButtonProps = {
  id: ToolId;
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
};

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

type ToolSidebarProps = {
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
};

export function ToolSidebar({ activeTool, onToolChange }: ToolSidebarProps) {
  return (
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
          onClick={() => onToolChange("crop")}
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-zinc-500/80">
            <span className="h-2 w-2 border border-zinc-300/80" />
          </span>
        </ToolButton>

        <ToolButton
          id="title"
          label="Title"
          isActive={activeTool === "title"}
          onClick={() => onToolChange("title")}
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
  );
}
