"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

interface EndChatOverlayProps {
  isVisible: boolean;
}

export function EndChatOverlay({ isVisible }: EndChatOverlayProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-xl paper-texture"
    >
      <div className="text-center p-8 max-w-md">
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="size-24 rounded-3xl bg-primary/10 sketch-border flex items-center justify-center mx-auto mb-8 relative overflow-hidden"
        >
          <Sparkles className="size-12 text-primary" />
          <motion.div
            animate={{ x: [-100, 100], y: [-100, 100], rotate: 45 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
          />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-black font-caveat mb-4"
        >
          Chat Ended
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-hand text-muted-text"
        >
          Poof! Every scribble has been permanently erased. The sketchbook is
          closed.
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 1.5 }}
          className="h-1 bg-primary/20 mt-8 sketch-border-sm origin-left"
        />
      </div>
    </motion.div>
  );
}
