import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/types";
import { format } from "date-fns";
import {
  Reply,
  Smile,
  Eye,
  EyeOff,
  Timer,
  Copy,
  Ghost,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessageProps {
  message: Message;
  isSelf: boolean;
  onReply: () => void;
  onAddReaction: (emoji: string) => void;
  onDelete?: (id: string) => void;
}

export function ChatMessage({
  message,
  isSelf,
  onReply,
  onAddReaction,
  onDelete,
}: ChatMessageProps) {
  const [isWhisperRevealed, setIsWhisperRevealed] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);

  useEffect(() => {
    if (
      isWhisperRevealed &&
      (message.isViewOnce || message.type === "whisper") &&
      !isSelf &&
      onDelete
    ) {
      // For View Once or Secret Whispers, start the "Ghost" fade
      setIsExpiring(true);
      const timer = setTimeout(() => {
        onDelete(message.id);
      }, 8000); // 8 seconds to read before it's gone
      return () => clearTimeout(timer);
    }
  }, [
    isWhisperRevealed,
    message.isViewOnce,
    message.type,
    isSelf,
    onDelete,
    message.id,
  ]);

  const emojiOptions = ["👍", "❤️", "😂", "🔥", "😮", "🙏"];

  if (message.type === "system") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-6"
      >
        <span className="text-[14px] font-caveat font-bold text-muted-text bg-white/30 px-4 py-1.5 sketch-border shadow-sm">
          ~ {message.content} ~
        </span>
      </motion.div>
    );
  }

  const [showActions, setShowActions] = useState(false);

  const isWhisper = message.type === "whisper";
  const shouldHideWhisper = isWhisper && !isWhisperRevealed && !isSelf;
  const isBigMessage =
    message.content.length > 200 || message.content.includes("```");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isExpiring ? [1, 0.8, 0.5, 0] : 1,
        scale: 1,
        filter: isExpiring ? "blur(4px)" : "blur(0px)",
      }}
      transition={{ duration: isExpiring ? 8 : 0.3 }}
      className={cn(
        "flex flex-col mb-4 max-w-[90%] md:max-w-[85%] group relative",
        isBigMessage && "w-full",
        isSelf ? "ml-auto items-end" : "mr-auto items-start",
      )}
    >
      <div className="flex items-center gap-2 mb-1 px-2">
        {!isSelf && (
          <span className="text-sm font-caveat font-black text-accent mb-0.5">
            {message.senderName}
            {message.recipientId && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-tighter bg-accent/10 px-1 rounded">
                <Lock className="size-2" /> Private
              </span>
            )}
          </span>
        )}
        <span className="text-[10px] text-muted-text/70 font-hand">
          {format(message.timestamp, "HH:mm")}
        </span>
        {message.isViewOnce && (
          <Ghost className="size-3 text-accent animate-pulse" />
        )}
      </div>

      <div
        className={cn(
          "relative flex flex-col",
          isBigMessage && "w-full",
          isSelf ? "items-end" : "items-start",
        )}
      >
        {/* Reply Context */}
        {message.replyToId && (
          <div
            className={cn(
              "mb-[-8px] text-[10px] font-hand text-muted-text/60 bg-white/20 px-3 pt-1 pb-3 sketch-border-sm rounded-t-lg truncate max-w-[180px] md:max-w-[200px] border-b-0",
              isSelf ? "mr-4" : "ml-4",
            )}
          >
            <Reply className="size-2.5 inline mr-1" />
            <span className="opacity-70">
              {message.replyToSenderName}:
            </span>{" "}
            {message.replyToContent}
          </div>
        )}

        <div
          className={cn(
            "px-4 md:px-5 py-2 md:py-3 text-sm md:text-base leading-relaxed font-hand transition-all relative z-10 break-words",
            isBigMessage && "w-full",
            isSelf
              ? "bg-primary text-text sketch-border border-text/10 rounded-tr-none sketch-shadow"
              : "bg-white/60 text-text sketch-border border-border rounded-tl-none",
            shouldHideWhisper && "blur-md select-none cursor-pointer",
            isExpiring && "cursor-not-allowed",
          )}
          onClick={() => {
            if (isExpiring) return;
            if (shouldHideWhisper) {
              setIsWhisperRevealed(true);
            } else {
              setShowActions(!showActions);
            }
          }}
        >
          {message.type === "file" ? (
            <div className="flex flex-col gap-3">
              {message.content.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={message.fileUrl}
                  alt={message.fileName}
                  className="max-w-full rounded-sm border-2 border-text/10"
                />
              ) : (
                <div className="flex items-center gap-3 bg-black/5 p-3 sketch-border-sm">
                  <span className="truncate max-w-[120px] md:max-w-[140px] font-bold">
                    {message.fileName}
                  </span>
                  <a
                    href={message.fileUrl}
                    download
                    className="text-accent underline font-caveat font-black text-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    download
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="relative overflow-hidden">
              {isWhisper && (
                <div className="absolute -top-1 -right-3 md:-right-4">
                  {isWhisperRevealed || isSelf ? (
                    <Eye className="size-3 text-muted-text/40" />
                  ) : (
                    <EyeOff className="size-3 text-muted-text/40" />
                  )}
                </div>
              )}
              {message.type === "sticker" ? (
                <div className="text-6xl md:text-8xl p-2 animate-bounce-subtle select-none sticker-effect">
                  {message.content}
                </div>
              ) : message.content.includes("```") ? (
                <div className="space-y-4">
                  {message.content.split(/(```[\s\S]*?```)/g).map((part, i) => {
                    if (part.startsWith("```") && part.endsWith("```")) {
                      const rawCode = part.slice(3, -3).trim();
                      const lines = rawCode.split("\n");
                      const firstLine = lines[0].trim();
                      const hasLang =
                        firstLine &&
                        firstLine.length < 15 &&
                        !firstLine.includes(" ");
                      const lang = hasLang ? firstLine : "";
                      const code = hasLang
                        ? lines.slice(1).join("\n")
                        : rawCode;

                      return (
                        <div
                          key={i}
                          className="my-2 bg-black/5 rounded-md sketch-border-sm overflow-hidden border-border/20 group/code"
                        >
                          <div className="bg-black/10 px-3 py-1.5 flex items-center justify-between border-b border-border/10">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-text/70">
                              {lang || "code"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(code);
                                toast.success("Code copied!");
                              }}
                              className="opacity-0 group-hover/code:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded"
                            >
                              <Copy className="size-3 text-muted-text" />
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto custom-scrollbar font-mono text-xs md:text-sm bg-white/30 selection:bg-accent/20">
                            <code>{code}</code>
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <p key={i} className="whitespace-pre-wrap">
                        {part}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          )}
        </div>

        {/* Self Destruct Hint */}
        {message.selfDestructAt && (
          <div className="absolute -top-2 -right-2 bg-warning text-white rounded-full p-1 sketch-border-sm animate-pulse z-20">
            <Timer className="size-3" />
          </div>
        )}

        {/* Actions Overlay */}
        <div
          className={cn(
            "absolute top-0 transition-all duration-200 flex gap-1 z-20",
            showActions || "group-hover:opacity-100"
              ? "opacity-100"
              : "opacity-0 pointer-events-none",
            isSelf ? "right-full mr-2" : "left-full ml-2",
            showActions ? "scale-110" : "scale-100",
          )}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply();
              setShowActions(false);
            }}
            className="p-1.5 bg-white/90 sketch-border-sm shadow-lg active:scale-90"
            title="Reply"
          >
            <Reply className="size-4 text-muted-text" />
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReactionPicker(!showReactionPicker);
              }}
              className="p-1.5 bg-white/90 sketch-border-sm shadow-lg active:scale-90"
              title="React"
            >
              <Smile className="size-4 text-muted-text" />
            </button>

            {showReactionPicker && (
              <div className="absolute bottom-full mb-2 left-0 bg-white sketch-border p-1 flex gap-1 z-30 shadow-xl">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onAddReaction(emoji);
                      setShowReactionPicker(false);
                    }}
                    className="hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reactions Display */}
      {message.reactions && message.reactions.length > 0 && (
        <div
          className={cn(
            "flex flex-wrap gap-1 mt-1",
            isSelf ? "justify-end" : "justify-start",
          )}
        >
          {message.reactions.map((r, i) => (
            <button
              key={i}
              onClick={() => onAddReaction(r.emoji)}
              className="px-2 py-0.5 bg-white/40 sketch-border-sm text-[10px] flex items-center gap-1 hover:bg-white/60 transition-colors"
            >
              <span>{r.emoji}</span>
              <span className="font-bold">{r.count}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
