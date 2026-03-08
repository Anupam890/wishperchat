"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sticker as StickerIcon } from "lucide-react";
import { motion } from "motion/react";

const STICKER_DATA = [
  { id: "cool", emoji: "😎", label: "Cool" },
  { id: "heart", emoji: "❤️", label: "Love" },
  { id: "laugh", emoji: "😂", label: "Haha" },
  { id: "wow", emoji: "😮", label: "Wow" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "fire", emoji: "🔥", label: "Lit" },
  { id: "party", emoji: "🎉", label: "Celebrate" },
  { id: "clap", emoji: "👏", label: "Clap" },
  { id: "mindblown", emoji: "🤯", label: "Mind Blown" },
  { id: "rock", emoji: "🤘", label: "Rock On" },
];

interface StickerPickerProps {
  onStickerSelect: (stickerUrl: string) => void;
}

export function StickerPicker({ onStickerSelect }: StickerPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-1.5 text-muted-text hover:text-accent transition-colors rounded-full hover:bg-black/5"
          title="Send a Sticker"
        >
          <StickerIcon className="size-6 stroke-[1.5]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-64 p-3 sketch-border bg-background paper-texture p-4 sketch-shadow border-none mb-4"
      >
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-text/50 mb-3 px-1">
          Doodle Stickers
        </div>
        <div className="grid grid-cols-5 gap-2">
          {STICKER_DATA.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              onClick={() => onStickerSelect(sticker.emoji)}
              className="size-10 flex items-center justify-center text-2xl hover:bg-black/5 rounded-sm transition-all hover:scale-125 active:scale-95 person-cursor-pointer"
            >
              {sticker.emoji}
            </button>
          ))}
        </div>

        {/* Placeholder for real doodle images */}
        <div className="mt-4 pt-3 border-t border-border/10">
          <div className="text-[9px] font-hand text-muted-text italic text-center">
            More hand-drawn stickers coming soon!
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
