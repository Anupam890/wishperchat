"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";
import { User, Message } from "@/lib/types";
import { getRandomNickname } from "@/lib/utils";
import { RoomHeader } from "@/components/RoomHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ParticipantList } from "@/components/ParticipantList";
import { RoomSummary } from "@/components/RoomSummary";
import { EndChatOverlay } from "@/components/EndChatOverlay";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { SketchPad } from "@/components/SketchPad";
import { PenTool, Users, Sparkles, MessageCircleWarning } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ChatRoomPage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | undefined>();
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDoodle, setShowDoodle] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [createdAt, setCreatedAt] = useState<number>(Date.now());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Session management
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSilentJoin, setIsSilentJoin] = useState(false);

  // Initialize session from sessionStorage or create new if joining
  useEffect(() => {
    const savedSession = sessionStorage.getItem(`whisperchat_session_${code}`);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setCurrentUser(session);
      setHasJoined(true);
      setIsSilentJoin(true);
    }
  }, [code]);

  // Handle connection
  useEffect(() => {
    if (!socket) return;
    if (!isConnected) {
      socket.connect();
    }
  }, [socket, isConnected]);

  // Handle joining when connected and user has clicked join (or has session)
  useEffect(() => {
    if (!socket || !isConnected || !code || !hasJoined || !currentUser) return;

    // Emit join with the stabilized user (either from session or fresh join)
    socket.emit("join_room", {
      roomCode: code,
      user: currentUser,
      isSilent: isSilentJoin,
    });

    socket.on(
      "room_state",
      ({
        participants,
        messages,
        locked,
        expiresAt,
        createdAt,
      }: {
        participants: User[];
        messages: Message[];
        locked: boolean;
        expiresAt: number;
        createdAt: number;
      }) => {
        setParticipants(participants);
        setMessages(messages);
        setIsLocked(locked);
        setExpiresAt(expiresAt);
        if (createdAt) setCreatedAt(createdAt);

        // Find self in participants to see if we are host
        const self = participants.find((p) => p.id === currentUser.id);
        if (self) {
          setCurrentUser(self);
          // Persist host status if updated
          sessionStorage.setItem(
            `whisperchat_session_${code}`,
            JSON.stringify(self),
          );
        }
      },
    );

    socket.on("participants_update", (updatedParticipants: User[]) => {
      setParticipants(updatedParticipants);
      const self = updatedParticipants.find((p) => p.id === currentUser.id);
      if (self) {
        setCurrentUser(self);
        sessionStorage.setItem(
          `whisperchat_session_${code}`,
          JSON.stringify(self),
        );
      }
    });

    socket.on("room_locked", ({ locked }: { locked: boolean }) => {
      setIsLocked(locked);
      toast.info(locked ? "Room has been locked" : "Room has been unlocked");
    });

    socket.on("receive_message", (message: Message) => {
      // Filter private messages
      if (
        message.recipientId &&
        message.recipientId !== currentUser?.id &&
        message.senderId !== currentUser?.id
      ) {
        return;
      }
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on("message_deleted", ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    socket.on(
      "reaction_added",
      ({
        messageId,
        emoji,
        userId: reactedUserId,
      }: {
        messageId: string;
        emoji: string;
        userId: string;
      }) => {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              const reactions = msg.reactions || [];
              const reactionIdx = reactions.findIndex((r) => r.emoji === emoji);
              if (reactionIdx > -1) {
                const reaction = reactions[reactionIdx];
                if (!reaction.users.includes(reactedUserId)) {
                  reaction.users.push(reactedUserId);
                  reaction.count = reaction.users.length;
                }
              } else {
                reactions.push({ emoji, count: 1, users: [reactedUserId] });
              }
              return { ...msg, reactions };
            }
            return msg;
          }),
        );
      },
    );

    socket.on(
      "typing",
      ({ nickname, isTyping }: { nickname: string; isTyping: boolean }) => {
        setTypingUsers((prev) =>
          isTyping
            ? Array.from(new Set([...prev, nickname]))
            : prev.filter((n) => n !== nickname),
        );
      },
    );

    socket.on("room_full", () => {
      toast.error("Room is full! Maximum 4 users allowed.");
      sessionStorage.removeItem(`whisperchat_session_${code}`);
      router.push("/");
    });

    socket.on("room_closed", () => {
      setIsEnding(true);
      sessionStorage.removeItem(`whisperchat_session_${code}`);
      setTimeout(() => {
        router.push("/");
      }, 4000);
    });

    socket.on("error", ({ message }: { message: string }) => {
      toast.error(message);
      if (message.includes("not found") || message.includes("locked")) {
        sessionStorage.removeItem(`whisperchat_session_${code}`);
        router.push("/");
      }
    });

    return () => {
      if (currentUser) {
        socket.emit("leave_room", {
          roomCode: code,
          userId: currentUser.id,
          nickname: currentUser.nickname,
        });
      }
      socket.off("room_state");
      socket.off("participants_update");
      socket.off("room_locked");
      socket.off("receive_message");
      socket.off("message_deleted");
      socket.off("reaction_added");
      socket.off("typing");
      socket.off("room_full");
      socket.off("room_closed");
      socket.off("draw");
      socket.off("clear_board");
      socket.off("error");
    };
  }, [socket, isConnected, code, router, hasJoined, currentUser?.id]);

  const handleManualJoin = () => {
    setIsJoining(true);
    const newUserId = uuidv4();
    const newNickname = getRandomNickname();
    const user = { id: newUserId, nickname: newNickname, isHost: false };

    setCurrentUser(user);
    setIsSilentJoin(false);
    setHasJoined(true);
    sessionStorage.setItem(`whisperchat_session_${code}`, JSON.stringify(user));
    setIsJoining(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // Handle self-destruct timers
    const now = Date.now();
    const timers: NodeJS.Timeout[] = [];

    messages.forEach((msg) => {
      if (msg.selfDestructAt && msg.selfDestructAt > now) {
        const timeout = setTimeout(() => {
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        }, msg.selfDestructAt - now);
        timers.push(timeout);
      } else if (msg.selfDestructAt && msg.selfDestructAt <= now) {
        // Already expired
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [messages, typingUsers]);

  const handleSendMessage = (
    content: string,
    type: "text" | "whisper" = "text",
    selfDestructDelay?: number,
    isViewOnce?: boolean,
    recipientId?: string,
  ) => {
    if (!socket || !currentUser) return;

    const message: Message = {
      id: uuidv4(),
      senderId: currentUser.id,
      senderName: currentUser.nickname,
      content,
      timestamp: Date.now(),
      type,
      replyToId: replyTarget?.id,
      replyToSenderName: replyTarget?.senderName,
      replyToContent: replyTarget?.content,
      selfDestructAt: selfDestructDelay
        ? Date.now() + selfDestructDelay
        : undefined,
      isViewOnce,
      recipientId,
    };

    socket.emit("send_message", { roomCode: code, message });
    setMessages((prev) => [...prev, message]);
    setReplyTarget(null);
  };

  const handleSendFile = async (file: File) => {
    if (!socket || !currentUser) return;

    const fileUrl = URL.createObjectURL(file);

    const message: Message = {
      id: uuidv4(),
      senderId: currentUser.id,
      senderName: currentUser.nickname,
      content: file.name,
      timestamp: Date.now(),
      type: "file",
      fileUrl,
      fileName: file.name,
    };

    socket.emit("send_message", { roomCode: code, message });
    setMessages((prev) => [...prev, message]);
  };

  const handleToggleLock = () => {
    if (!socket || !currentUser?.isHost) return;
    socket.emit("lock_room", { roomCode: code, locked: !isLocked });
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!socket || !currentUser) return;
    socket.emit("add_reaction", {
      roomCode: code,
      messageId,
      emoji,
      userId: currentUser.id,
    });

    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          const reactionIdx = reactions.findIndex((r) => r.emoji === emoji);
          if (reactionIdx > -1) {
            const reaction = reactions[reactionIdx];
            if (!reaction.users.includes(currentUser.id)) {
              reaction.users.push(currentUser.id);
              reaction.count = reaction.users.length;
            }
          } else {
            reactions.push({ emoji, count: 1, users: [currentUser.id] });
          }
          return { ...msg, reactions };
        }
        return msg;
      }),
    );
  };

  const handleTyping = () => {
    if (!socket || !currentUser) return;

    socket.emit("typing", {
      roomCode: code,
      nickname: currentUser.nickname,
      isTyping: true,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        roomCode: code,
        nickname: currentUser.nickname,
        isTyping: false,
      });
    }, 2000);
  };

  const handleDeleteMessage = (messageId: string) => {
    socket?.emit("delete_message", { roomCode: code, messageId });
  };

  const handleLeave = () => {
    if (currentUser?.isHost) {
      setShowSummary(true);
    } else {
      setShowLeaveConfirm(true);
    }
  };

  const confirmLeave = () => {
    socket?.emit("end_chat", { roomCode: code });
    setShowLeaveConfirm(false);
  };

  if (!code) return null;

  const isWaiting = participants.length < 2;

  if (!hasJoined) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-background text-text paper-texture p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-secondary-bg/40 sketch-border p-8 md:p-12 text-center sketch-shadow"
        >
          <div className="size-20 rounded-2xl bg-primary/10 sketch-border flex items-center justify-center mx-auto mb-6 -rotate-6">
            <Sparkles className="size-10 text-primary" />
          </div>
          <h2 className="text-4xl font-black font-caveat mb-2">
            Ready to Scribble?
          </h2>
          <p className="text-xl font-hand text-muted-text mb-8">
            You're about to enter room{" "}
            <span className="text-accent font-bold uppercase">{code}</span>. All
            messages are temporary and will be erased forever when you leave.
          </p>

          <Button
            onClick={handleManualJoin}
            disabled={isJoining}
            className="w-full h-14 text-2xl font-caveat font-black gap-3 sketch-border-sm hover:scale-105 transition-transform"
          >
            {isJoining ? "Joining..." : "Join Conversation"}
          </Button>

          <p className="mt-6 text-sm font-hand opacity-50">
            A random nickname will be assigned to you.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-background text-text overflow-hidden paper-texture">
      <EndChatOverlay isVisible={isEnding} />

      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent className="sketch-border bg-background paper-texture p-8 sketch-shadow max-w-[90vw] md:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-error/10 sketch-border-sm flex items-center justify-center -rotate-6">
                <MessageCircleWarning className="size-6 text-error" />
              </div>
              <AlertDialogTitle className="text-3xl font-caveat font-black tracking-tight">
                Leave Room?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xl font-hand text-muted-text/80 leading-snug">
              This will end the conversation for everyone and permanently delete
              all messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="h-12 text-xl font-caveat font-bold sketch-border-sm hover:bg-secondary-bg transition-colors">
              Stay Here
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeave}
              className="h-12 text-xl font-caveat font-bold bg-error text-white sketch-border-sm hover:scale-105 transition-transform"
            >
              End Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {showSummary && (
        <RoomSummary
          participants={participants}
          messages={messages}
          createdAt={createdAt}
          onClose={confirmLeave}
        />
      )}

      <RoomHeader
        roomCode={code}
        participantCount={participants.length}
        onLeave={handleLeave}
        expiresAt={expiresAt}
        isLocked={isLocked}
        isHost={!!currentUser?.isHost}
        onToggleLock={handleToggleLock}
        showDoodle={showDoodle}
        onToggleDoodle={() => setShowDoodle(!showDoodle)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col min-w-0 relative">
          {showDoodle ? (
            <SketchPad socket={socket} roomCode={code} />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 md:px-12 md:py-8">
                <div className="max-w-3xl mx-auto flex flex-col min-h-full">
                  {isWaiting && messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40 select-none"
                    >
                      <div className="size-24 rounded-full bg-secondary-bg sketch-border flex items-center justify-center mb-6 animate-pulse">
                        <Users
                          className="size-10 text-muted-text"
                          strokeWidth={1}
                        />
                      </div>
                      <h3 className="text-3xl font-black mb-2 font-caveat tracking-tight">
                        Waiting for someone to join...
                      </h3>
                      <p className="text-lg font-hand max-w-[280px]">
                        The conversation becomes active once at least 2 people
                        are here.
                      </p>
                    </motion.div>
                  ) : (
                    messages.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-20 select-none"
                      >
                        <PenTool className="size-20 mb-4 opacity-10" />
                        <h3 className="text-5xl font-black mb-2 font-caveat">
                          Start Scribbling
                        </h3>
                        <p className="text-2xl font-hand uppercase tracking-widest text-primary font-bold">
                          The room is active
                        </p>
                      </motion.div>
                    )
                  )}

                  <AnimatePresence mode="popLayout" initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{
                          opacity: 0,
                          x: msg.senderId === currentUser?.id ? 20 : -20,
                        }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <ChatMessage
                          key={msg.id}
                          message={msg}
                          isSelf={msg.senderId === currentUser?.id}
                          onReply={() => setReplyTarget(msg)}
                          onAddReaction={(emoji) =>
                            handleAddReaction(msg.id, emoji)
                          }
                          onDelete={handleDeleteMessage}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {typingUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 ml-6 flex items-baseline gap-2 text-xl font-bold font-caveat text-muted-text/70 italic"
                    >
                      <span className="animate-pulse">
                        {typingUsers.length === 1
                          ? `${typingUsers[0]} is typing...`
                          : `${typingUsers.length} people are typing...`}
                      </span>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} className="h-6" />
                </div>
              </div>

              <ChatInput
                onSendMessage={handleSendMessage}
                onSendFile={handleSendFile}
                onTyping={handleTyping}
                replyTarget={replyTarget}
                onCancelReply={() => setReplyTarget(null)}
                participants={participants}
                currentUser={currentUser}
              />
            </>
          )}
        </div>

        <ParticipantList participants={participants} />
      </div>
    </div>
  );
}
