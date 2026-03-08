"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";
import { Button } from "@/components/ui/button";
import { CodeInput } from "@/components/CodeInput";
import { generateRoomCode } from "@/lib/utils";
import {
  MessageSquarePlus,
  Sparkles,
  ArrowRight,
  Star,
  Pencil,
  NotepadText,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

export default function HomePage() {
  const { socket, isConnected } = useSocket();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (socket && !isConnected) {
      socket.connect();
    }
  }, [socket, isConnected]);

  const handleCreateRoom = () => {
    if (!socket) return;
    setLoading(true);

    const onRoomCreated = ({ roomCode }: { roomCode: string }) => {
      router.push(`/room/${roomCode}`);
    };

    const emitCreate = () => {
      socket.once("room_created", onRoomCreated);
      socket.emit("create_room");
    };

    if (isConnected) {
      emitCreate();
    } else {
      socket.connect();
      socket.once("connect", emitCreate);
    }

    // Safety timeout to prevent stuck loading state
    setTimeout(() => {
      setLoading(false);
    }, 8000);
  };

  const handleJoinRoom = () => {
    if (code.length !== 6) {
      toast.error("Need a 6-digit scribble code!");
      return;
    }
    setLoading(true);
    router.push(`/room/${code}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background paper-texture">
      {/* Doodle Decorations */}
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute top-10 left-10 text-primary/20 opacity-50"
      >
        <Star className="size-20 fill-current" />
      </motion.div>
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute bottom-20 right-20 text-accent/20 opacity-50"
      >
        <Pencil className="size-24 rotate-45" />
      </motion.div>
      <div className="absolute top-1/4 right-1/4 text-secondary-bg rotate-12 -z-10">
        <NotepadText className="size-64 opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center z-10"
      >
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
          <div className="size-20 rounded-[40%_60%_70%_30%/40%_50%_60%_40%] bg-primary/10 border-2 border-primary/20 flex items-center justify-center rotate-3 relative shadow-inner">
            <Sparkles className="size-10 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-7xl font-black mb-2 tracking-tight text-text font-caveat drop-shadow-sm">
          WhisperChat
        </h1>
        <p className="text-muted-text mb-12 text-xl font-hand">
          Private conversations that disappear. <br /> Like a secret note passed
          in class.
        </p>

        <div className="flex items-center justify-center gap-2 mb-4 text-xs font-hand opacity-50">
          <div
            className={`size-2 rounded-full ${isConnected ? "bg-success" : "bg-danger animate-pulse"}`}
          />
          {isConnected
            ? "Connected to Sketchbook"
            : "Pencil lead is broken (Connecting...)"}
        </div>

        <div className="bg-white/40 backdrop-blur-md p-10 rounded-[4rem_2rem_5rem_3rem/3rem_4rem_2rem_5rem] border-2 border-border shadow-[10px_10px_0px_0px_rgba(191,165,138,0.2)] relative">
          {/* Hand drawn loop detail */}
          <div className="absolute -top-4 -left-4 size-12 bg-secondary-bg sketch-border -rotate-12 flex items-center justify-center text-xs font-black uppercase tracking-tighter shadow-sm">
            Pssst!
          </div>

          <div className="flex flex-col gap-6">
            <Button
              onClick={handleCreateRoom}
              disabled={loading}
              size="lg"
              className="w-full h-16 text-2xl rotate-1 hover:rotate-0 transition-transform shadow-lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sketching Room...
                </div>
              ) : (
                <>
                  <MessageSquarePlus className="size-7 mr-2" />
                  Draw a New Room
                </>
              )}
            </Button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
              <span className="text-lg font-caveat font-black text-muted-text uppercase tracking-[0.3em]">
                or join
              </span>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            </div>

            <div className="space-y-8">
              <CodeInput
                value={code}
                onChange={setCode}
                onComplete={handleJoinRoom}
                disabled={loading}
              />

              <Button
                onClick={handleJoinRoom}
                disabled={loading || code.length !== 6}
                variant="outline"
                className="w-full h-14 -rotate-1 hover:rotate-0 text-xl font-bold border-2"
              >
                Join the Scribble
                <ArrowRight className="size-6 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-16 flex justify-around opacity-60 font-caveat font-black select-none">
          <div className="flex flex-col items-center">
            <span className="text-3xl">2-4</span>
            <span className="text-xs uppercase tracking-widest -mt-1">
              Doodlers
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl">Safe</span>
            <span className="text-xs uppercase tracking-widest -mt-1">
              Encrypted
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl">Clean</span>
            <span className="text-xs uppercase tracking-widest -mt-1">
              No Trace
            </span>
          </div>
        </div>
      </motion.div>

      {/* Footer doodle */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-20 font-caveat text-sm">
        hand-crafted with care & lead pencils
      </div>
    </main>
  );
}
