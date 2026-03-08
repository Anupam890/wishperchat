import { Server, Socket } from "socket.io";
import { roomManager } from "../rooms/roomManager";
import { User, Message } from "../rooms/roomTypes";

const messageRateLimits = new Map<
  string,
  { count: number; lastReset: number }
>();
const joinAttempts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 2000; // 2 seconds
const MAX_MESSAGES = 5;
const JOIN_LIMIT_WINDOW = 60000; // 1 minute
const MAX_JOIN_ATTEMPTS = 10;

export const socketHandler = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    const checkJoinAttempt = (): boolean => {
      const now = Date.now();
      const userAttempts = joinAttempts.get(socket.id) || {
        count: 0,
        lastReset: now,
      };

      if (now - userAttempts.lastReset > JOIN_LIMIT_WINDOW) {
        userAttempts.count = 1;
        userAttempts.lastReset = now;
        joinAttempts.set(socket.id, userAttempts);
        return true;
      }

      if (userAttempts.count >= MAX_JOIN_ATTEMPTS) {
        return false;
      }

      userAttempts.count++;
      joinAttempts.set(socket.id, userAttempts);
      return true;
    };

    const checkRateLimit = (userId: string): boolean => {
      const now = Date.now();
      const userLimit = messageRateLimits.get(userId) || {
        count: 0,
        lastReset: now,
      };

      if (now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
        userLimit.count = 1;
        userLimit.lastReset = now;
        messageRateLimits.set(userId, userLimit);
        return true;
      }

      if (userLimit.count >= MAX_MESSAGES) {
        return false;
      }

      userLimit.count++;
      messageRateLimits.set(userId, userLimit);
      return true;
    };

    socket.on("create_room", async () => {
      try {
        const roomCode = await roomManager.createRoom();
        socket.emit("room_created", { roomCode });
        console.log(`Room created: ${roomCode}`);
      } catch (error) {
        socket.emit("error", { message: "Failed to create room" });
      }
    });

    socket.on(
      "join_room",
      async ({
        roomCode,
        user,
        isSilent = false,
      }: {
        roomCode: string;
        user: User;
        isSilent?: boolean;
      }) => {
        if (!checkJoinAttempt()) {
          socket.emit("error", {
            message: "Too many join attempts. Please wait a minute.",
          });
          return;
        }

        const room = await roomManager.getRoom(roomCode);

        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.locked) {
          socket.emit("error", { message: "Room is locked" });
          return;
        }

        if (room.participants.length >= 4) {
          socket.emit("room_full");
          return;
        }

        const joined = await roomManager.joinRoom(roomCode, user);
        if (joined) {
          socket.join(roomCode);

          const updatedRoom = await roomManager.getRoom(roomCode);
          if (updatedRoom) {
            // Send full state to joining user
            socket.emit("room_state", {
              participants: updatedRoom.participants,
              messages: updatedRoom.messages,
              locked: updatedRoom.locked,
              expiresAt: updatedRoom.expiresAt,
              createdAt: updatedRoom.createdAt,
            });

            // Broadcast participants update to everyone
            io.to(roomCode).emit(
              "participants_update",
              updatedRoom.participants,
            );

            // Only send join notification if not a silent reconnect
            if (!isSilent) {
              const systemMsg: Message = {
                id: `sys-${Date.now()}`,
                senderId: "system",
                senderName: "System",
                content: `${user.nickname} joined the room`,
                timestamp: Date.now(),
                type: "system",
              };
              await roomManager.addMessage(roomCode, systemMsg);
              io.to(roomCode).emit("receive_message", systemMsg);
            }
          }
        }
      },
    );

    socket.on(
      "lock_room",
      async ({ roomCode, locked }: { roomCode: string; locked: boolean }) => {
        await roomManager.setRoomLock(roomCode, locked);
        io.to(roomCode).emit("room_locked", { locked });
      },
    );

    socket.on(
      "send_message",
      async ({ roomCode, message }: { roomCode: string; message: Message }) => {
        if (!checkRateLimit(message.senderId)) {
          socket.emit("error", {
            message: "Slow down! You're sending messages too fast.",
          });
          return;
        }

        if (message.content.length > 5000) {
          socket.emit("error", { message: "Message is too long." });
          return;
        }

        await roomManager.addMessage(roomCode, message);
        socket.to(roomCode).emit("receive_message", message);
      },
    );

    socket.on(
      "delete_message",
      async ({
        roomCode,
        messageId,
      }: {
        roomCode: string;
        messageId: string;
      }) => {
        await roomManager.deleteMessage(roomCode, messageId);
        io.to(roomCode).emit("message_deleted", { messageId });
      },
    );

    socket.on(
      "add_reaction",
      async ({
        roomCode,
        messageId,
        emoji,
        userId,
      }: {
        roomCode: string;
        messageId: string;
        emoji: string;
        userId: string;
      }) => {
        await roomManager.addReaction(roomCode, messageId, emoji, userId);
        io.to(roomCode).emit("reaction_added", { messageId, emoji, userId });
      },
    );

    socket.on(
      "typing",
      ({
        roomCode,
        nickname,
        isTyping,
      }: {
        roomCode: string;
        nickname: string;
        isTyping: boolean;
      }) => {
        socket.to(roomCode).emit("typing", { nickname, isTyping });
      },
    );

    socket.on(
      "leave_room",
      async ({
        roomCode,
        userId,
        nickname,
      }: {
        roomCode: string;
        userId: string;
        nickname?: string;
      }) => {
        await roomManager.leaveRoom(roomCode, userId);
        socket.leave(roomCode);

        const updatedRoom = await roomManager.getRoom(roomCode);

        // Broadcast system message
        const systemMsg: Message = {
          id: `sys-${Date.now()}`,
          senderId: "system",
          senderName: "System",
          content: `${nickname || "User"} left the room`,
          timestamp: Date.now(),
          type: "system",
        };

        if (updatedRoom) {
          io.to(roomCode).emit("participants_update", updatedRoom.participants);
          io.to(roomCode).emit("receive_message", systemMsg);
        }

        console.log(`User ${userId} left room: ${roomCode}`);
      },
    );

    socket.on("end_chat", async ({ roomCode }: { roomCode: string }) => {
      io.to(roomCode).emit("room_closed");
      await roomManager.deleteRoom(roomCode);
    });

    socket.on("draw", ({ roomCode, data }: { roomCode: string; data: any }) => {
      socket.to(roomCode).emit("draw_data", data);
    });

    socket.on("clear_board", ({ roomCode }: { roomCode: string }) => {
      io.to(roomCode).emit("clear_board");
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
