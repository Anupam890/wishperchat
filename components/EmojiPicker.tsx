import EmojiPickerReact, { Theme, EmojiClickData } from "emoji-picker-react";
import { Smile } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-1.5 text-muted-text hover:text-text transition-colors rounded-full hover:bg-black/5"
        >
          <Smile className="size-6 stroke-[1.5]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-auto p-0 sketch-border bg-secondary-bg sketch-shadow border-none mb-4"
      >
        <EmojiPickerReact
          onEmojiClick={(data: EmojiClickData) => {
            onEmojiSelect(data.emoji);
          }}
          autoFocusSearch={false}
          theme={Theme.LIGHT}
        />
      </PopoverContent>
    </Popover>
  );
}
