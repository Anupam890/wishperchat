"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Eye,
  EyeOff,
  X,
  Paperclip,
  Reply as ReplyIcon,
  Timer,
  Ghost,
  User as UserIcon,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "./EmojiPicker";
import { FileUpload } from "./FileUpload";
import { StickerPicker } from "./StickerPicker";
import { Message, User } from "@/lib/types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatInputProps {
  onSendMessage: (
    content: string,
    type: "text" | "whisper" | "sticker",
    selfDestruct?: number,
    isViewOnce?: boolean,
    recipientId?: string,
  ) => void;
  onSendFile: (file: File) => void;
  onTyping: () => void;
  replyTarget: Message | null;
  onCancelReply: () => void;
  participants: User[];
  currentUser: User | null;
}

export function ChatInput({
  onSendMessage,
  onSendFile,
  onTyping,
  replyTarget,
  onCancelReply,
  participants,
  currentUser,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isWhisper, setIsWhisper] = useState(false);
  const [selfDestruct, setSelfDestruct] = useState<number | null>(null); // ms
  const [isDragging, setIsDragging] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [showRecipientList, setShowRecipientList] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleStickerSelect = (emoji: string) => {
    onSendMessage(
      emoji,
      "sticker",
      selfDestruct || undefined,
      isViewOnce,
      recipientId || undefined,
    );
    setIsViewOnce(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = message.trim();
    if (content) {
      setMessage("");
      onSendMessage(
        content,
        isWhisper ? "whisper" : "text",
        selfDestruct || undefined,
        isViewOnce,
        recipientId || undefined,
      );
      // Reset temporary states
      setIsViewOnce(false);
      // We keep recipientId and isWhisper if they are having a private conversation
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const toggleSelfDestruct = () => {
    if (selfDestruct === null) setSelfDestruct(10000);
    else if (selfDestruct === 10000) setSelfDestruct(60000);
    else setSelfDestruct(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else {
      onTyping();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onSendFile(files[0]);
    }
  };

  return (
    <div
      className={cn(
        "p-4 bg-secondary-bg/80 border-t-2 border-border/30 paper-texture sticky bottom-0 z-30 transition-colors",
        isDragging && "bg-primary/20",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        <AnimatePresence>
          {replyTarget && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-between bg-white/40 sketch-border-sm px-4 py-2 text-sm font-hand"
            >
              <div className="flex items-center gap-2 truncate">
                <ReplyIcon className="size-3 text-accent" />
                <span className="font-bold text-accent">
                  Replying to {replyTarget.senderName}:
                </span>
                <span className="truncate opacity-60 italic">
                  {replyTarget.content}
                </span>
              </div>
              <button
                onClick={onCancelReply}
                className="hover:scale-110 transition-transform p-1"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-3">
          <div className="flex-1 flex flex-col bg-white/50 sketch-border border-border focus-within:border-primary transition-all sketch-shadow">
            <div className="flex items-center gap-1 px-2 md:px-3 py-1.5 border-b border-border/10 bg-black/5 overflow-x-auto no-scrollbar">
              <div className="relative">
                <Popover
                  open={showRecipientList}
                  onOpenChange={setShowRecipientList}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 px-1.5 md:px-2 flex items-center gap-1 md:gap-1.5 font-caveat font-bold text-base md:text-lg transition-colors shrink-0",
                        recipientId
                          ? "text-accent bg-accent/10 border border-accent/20"
                          : "text-muted-text hover:text-text",
                      )}
                    >
                      <UserIcon className="size-3.5 md:size-4" />
                      <span className="truncate max-w-[80px]">
                        {recipientId
                          ? participants.find((p) => p.id === recipientId)
                              ?.nickname
                          : "Everyone"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-56 p-2 sketch-border bg-background paper-texture p-4 sketch-shadow mb-2 border-none"
                  >
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-text/50 mb-2 px-2 flex items-center gap-2">
                      <Lock className="size-2.5" /> Target Recipient
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRecipientId(null);
                          setShowRecipientList(false);
                          setIsWhisper(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm font-hand rounded-sm transition-colors flex items-center justify-between",
                          !recipientId
                            ? "bg-primary/20 text-primary font-bold"
                            : "hover:bg-black/5",
                        )}
                      >
                        <span>Entire Room</span>
                        {!recipientId && (
                          <div className="size-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                      <div className="h-[1px] bg-border/10 my-1" />
                      {participants
                        .filter((p) => p.id !== currentUser?.id)
                        .map((p) => (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => {
                              setRecipientId(p.id);
                              setShowRecipientList(false);
                              setIsWhisper(true);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm font-hand rounded-sm transition-colors flex items-center justify-between",
                              recipientId === p.id
                                ? "bg-primary/20 text-primary font-bold"
                                : "hover:bg-black/5",
                            )}
                          >
                            <span>{p.nickname}</span>
                            {recipientId === p.id && (
                              <div className="size-1.5 rounded-full bg-primary" />
                            )}
                          </button>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="h-4 w-[1px] bg-border/20 mx-1 shrink-0" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsViewOnce(!isViewOnce)}
                className={cn(
                  "h-7 px-1.5 md:px-2 flex items-center gap-1 md:gap-1.5 font-caveat font-bold text-base md:text-lg transition-colors shrink-0",
                  isViewOnce
                    ? "text-accent bg-accent/20 border border-accent/20"
                    : "text-muted-text hover:text-text",
                )}
              >
                <Ghost className="size-3.5 md:size-4" />
                <span className="hidden xs:inline">View Once</span>
                <span className="xs:hidden">Once</span>
              </Button>

              <div className="h-4 w-[1px] bg-border/20 mx-1 shrink-0" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleSelfDestruct}
                className={cn(
                  "h-7 px-1.5 md:px-2 flex items-center gap-1 md:gap-1.5 font-caveat font-bold text-base md:text-lg transition-colors shrink-0",
                  selfDestruct
                    ? "text-warning bg-warning/10 border border-warning/20"
                    : "text-muted-text hover:text-text",
                )}
              >
                <Timer className="size-3.5 md:size-4" />
                <span>
                  {selfDestruct ? (
                    selfDestruct === 10000 ? (
                      "10s"
                    ) : (
                      "1m"
                    )
                  ) : (
                    <span className="hidden xs:inline">Self-Destruct</span>
                  )}
                </span>
                {!selfDestruct && <span className="xs:hidden">Timer</span>}
              </Button>

              <div className="h-4 w-[1px] bg-border/20 mx-1 shrink-0" />

              <div className="flex items-center shrink-0">
                <EmojiPicker
                  onEmojiSelect={(emoji) => setMessage((prev) => prev + emoji)}
                />
                <StickerPicker onStickerSelect={handleStickerSelect} />
                <FileUpload onFileSelect={onSendFile} />
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isWhisper
                  ? "Ssshh... scribble a whisper..."
                  : "Scribble a message..."
              }
              className="w-full bg-transparent border-none focus:ring-0 text-lg py-3 px-4 resize-none max-h-96 min-h-[48px] outline-none placeholder:text-muted-text/40 font-hand custom-scrollbar"
              rows={1}
            />
          </div>

          <Button
            type="submit"
            disabled={!message.trim()}
            size="icon"
            variant="accent"
            className="rounded-full size-12 shrink-0 transition-transform active:rotate-12 sketch-border-sm"
          >
            <Send className="size-5 -mr-0.5 mt-0.5" />
          </Button>
        </form>
      </div>

      {isDragging && (
        <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center pointer-events-none border-4 border-dashed border-primary m-2 z-50">
          <div className="flex flex-col items-center gap-4 text-white">
            <Paperclip className="size-16 animate-bounce" />
            <h4 className="text-3xl font-caveat font-black drop-shadow-md underline decoration-wavy">
              Drop file to scribble
            </h4>
          </div>
        </div>
      )}
    </div>
  );
}
