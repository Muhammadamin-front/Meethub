"use client";

import { Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { STICKERS } from "@/lib/emoji";

/**
 * A small emoji-sticker picker that opens above the chat composer. Picking a
 * sticker sends it immediately as its own message (handled by the parent).
 */
export function StickerPicker({
  onPick,
  disabled,
  label,
}: {
  onPick: (sticker: string) => void;
  disabled?: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        aria-label={label}
        title={label}
        onClick={() => setOpen((o) => !o)}
      >
        <Smile className="size-5" />
      </Button>

      {open && (
        <div className="bg-popover ring-foreground/10 animate-in fade-in-0 zoom-in-95 absolute right-0 bottom-full z-50 mb-2 grid w-64 grid-cols-7 gap-0.5 rounded-xl p-2 shadow-lg ring-1 duration-100">
          {STICKERS.map((s) => (
            <button
              key={s}
              type="button"
              className="hover:bg-accent flex size-8 items-center justify-center rounded-md text-xl transition-colors"
              onClick={() => {
                onPick(s);
                setOpen(false);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
