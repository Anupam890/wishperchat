"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Copy,
  Check,
  Users,
  Sparkles,
  Lock,
  Unlock,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

interface RoomHeaderProps {
  roomCode: string;
  participantCount: number;
  onLeave: () => void;
  expiresAt?: number;
  isLocked: boolean;
  isHost: boolean;
  onToggleLock: () => void;
  onToggleDoodle: () => void;
  showDoodle: boolean;
}

const RoomTimer = ({ expiresAt }: { expiresAt?: number }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <div className="flex items-center gap-2 text-warning italic font-bold font-caveat text-xl">
      <Timer className="size-5" />
      <span>Expires in {timeLeft}</span>
    </div>
  );
};

const RoomTimerShort = ({ expiresAt }: { expiresAt?: number }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("0:00");
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return <span>{timeLeft}</span>;
};

export function RoomHeader({
  roomCode,
  participantCount,
  onLeave,
  expiresAt,
  isLocked,
  isHost,
  onToggleLock,
  onToggleDoodle,
  showDoodle,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-6 border-b-2 border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-40 paper-texture">
      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-2">
          <div className="size-8 md:size-10 rounded-xl bg-primary/10 sketch-border flex items-center justify-center -rotate-6 shrink-0">
            <Sparkles className="size-5 md:size-6 text-primary" />
          </div>
          <h1 className="text-xl md:text-3xl font-black text-text font-caveat tracking-tight hidden xs:block">
            WhisperChat
          </h1>
        </div>

        <div className="h-6 md:h-8 w-[2px] bg-border/20 rotate-12 mx-1 hidden sm:block" />

        <button
          onClick={copyCode}
          className="flex items-center gap-2 px-2 md:px-3 py-1 sketch-border-sm bg-white/50 hover:bg-white/80 transition-all group sketch-shadow-sm active:translate-y-0.5 shrink-0"
        >
          <span className="text-sm md:text-xl font-hand tracking-[0.1em] md:tracking-[0.2em] text-accent font-black uppercase">
            {roomCode}
          </span>
          {copied ? (
            <Check className="size-3 md:size-4 text-success" />
          ) : (
            <Copy className="size-3 md:size-4 text-muted-text group-hover:text-accent transition-colors" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-8">
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-1.5 md:gap-2 text-muted-text font-caveat font-bold text-lg md:text-xl">
            <Users className="size-4 md:size-5" />
            <span>
              {participantCount}
              <span className="hidden xs:inline">/4</span>
            </span>
          </div>

          <div className="block lg:hidden">
            {expiresAt && (
              <div className="flex items-center gap-1 text-warning italic font-bold font-caveat text-lg">
                <Timer className="size-4" />
                <RoomTimerShort expiresAt={expiresAt} />
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          <RoomTimer expiresAt={expiresAt} />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isHost && (
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleLock}
              className={`size-8 md:size-10 sketch-border-sm hover:scale-105 transition-transform ${isLocked ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}
              title={isLocked ? "Unlock room" : "Lock room"}
            >
              {isLocked ? (
                <Lock className="size-4 md:size-5" />
              ) : (
                <Unlock className="size-4 md:size-5" />
              )}
            </Button>
          )}

          {!isHost && isLocked && (
            <div className="flex items-center text-error font-bold font-caveat text-lg md:text-xl gap-1">
              <Lock className="size-4" />
              <span className="hidden sm:inline">Locked</span>
            </div>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={onLeave}
            className="h-8 md:h-10 px-2 md:px-3 gap-1 md:gap-2 -rotate-2 sketch-border-sm shrink-0"
          >
            <LogOut className="size-3.5 md:size-4" />
            <span className="hidden xs:inline">Close</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
