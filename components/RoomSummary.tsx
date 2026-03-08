"use client";

import { motion } from "motion/react";
import { Users, MessageSquare, Clock, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User, Message } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface RoomSummaryProps {
  participants: User[];
  messages: Message[];
  createdAt: number;
  onClose: () => void;
}

export function RoomSummary({
  participants,
  messages,
  createdAt,
  onClose,
}: RoomSummaryProps) {
  const duration = formatDistanceToNow(createdAt);
  const totalMessages = messages.length;
  const totalFiles = messages.filter((m) => m.type === "file").length;
  const totalStickers = messages.filter((m) => m.type === "sticker").length;
  const activeParticipants = participants.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        className="w-full max-w-md bg-background paper-texture sketch-border sketch-shadow-lg p-8 relative overflow-hidden"
      >
        <div className="absolute -top-6 -right-6 size-24 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-6 -left-6 size-24 bg-accent/10 rounded-full blur-2xl" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors"
        >
          <X className="size-6 text-muted-text" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 bg-primary/10 sketch-border mb-4 rotate-3">
            <Sparkles className="size-8 text-primary" />
          </div>
          <h2 className="text-4xl font-black font-caveat tracking-tight text-text">
            Session Summary
          </h2>
          <p className="font-hand text-muted-text">
            Before the scribbles vanish...
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 sketch-border-sm p-4 text-center">
              <Clock className="size-5 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-black font-caveat">{duration}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-text font-black">
                Chatting Time
              </div>
            </div>
            <div className="bg-white/50 sketch-border-sm p-4 text-center">
              <Users className="size-5 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-black font-caveat">
                {activeParticipants}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-text font-black">
                Scribblers
              </div>
            </div>
          </div>

          <div className="bg-white/50 sketch-border-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/5 sketch-border-sm">
                  <MessageSquare className="size-4" />
                </div>
                <span className="font-hand text-lg">Total Messages</span>
              </div>
              <span className="font-black font-caveat text-2xl">
                {totalMessages}
              </span>
            </div>

            <div className="h-[1px] bg-border/20" />

            <div className="grid grid-cols-2 gap-4 text-sm font-hand opacity-70">
              <div className="flex justify-between">
                <span>Files Shared</span>
                <span className="font-bold">{totalFiles}</span>
              </div>
              <div className="flex justify-between">
                <span>Stickers Sent</span>
                <span className="font-bold">{totalStickers}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={onClose}
            className="w-full h-14 text-2xl font-caveat font-black sketch-border-sm hover:scale-[1.02] transition-transform active:scale-95 shadow-lg"
          >
            Finish & Close Room
          </Button>
          <p className="text-center text-[10px] font-hand text-muted-text mt-4 italic">
            "Everything we said is now dust in the wind."
          </p>
        </div>
      </motion.div>
    </div>
  );
}
