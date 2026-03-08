import { Room, User, Message } from "./roomTypes";
import { generateRoomCode } from "../utils/generateRoomCode";
import { supabase } from "../config/supabaseConfig";

export class RoomManager {
  private readonly CLEANUP_INTERVAL = 60000; // Check every 1 minute
  private readonly INACTIVITY_LIMIT = 600000; // 10 minutes
  private readonly ROOM_EXPIRY_LIMIT = 1800000; // 30 minutes

  constructor() {
    this.startCleanupTask();
  }

  async createRoom(): Promise<string> {
    let code = generateRoomCode();

    // Check uniqueness in Supabase
    let { data: existing } = await supabase
      .from("rooms")
      .select("code")
      .eq("code", code)
      .maybeSingle();

    while (existing) {
      code = generateRoomCode();
      const { data } = await supabase
        .from("rooms")
        .select("code")
        .eq("code", code)
        .maybeSingle();
      existing = data;
    }

    const now = Date.now();
    const expiresAt = now + this.ROOM_EXPIRY_LIMIT;

    const newRoom = {
      code,
      participants: [],
      messages: [],
      last_activity: new Date(now).toISOString(),
      created_at: new Date(now).toISOString(),
      locked: false,
      expires_at: new Date(expiresAt).toISOString(),
    };

    const { error } = await supabase.from("rooms").insert(newRoom);
    if (error) {
      console.error("Error creating room in Supabase:", error);
      throw new Error("Failed to create room");
    }

    return code;
  }

  async getRoom(code: string): Promise<Room | undefined> {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching room ${code}:`, error);
        return undefined;
      }

      if (!data) {
        console.log(`Room not found in DB: [${code}]`);
        return undefined;
      }

      return {
        code: data.code,
        participants: data.participants as User[],
        messages: data.messages as Message[],
        createdAt: new Date(data.created_at).getTime(),
        lastActivity: new Date(data.last_activity).getTime(),
        locked: data.locked || false,
        expiresAt: new Date(data.expires_at).getTime(),
      };
    } catch (e) {
      console.error(`Exception in getRoom for ${code}:`, e);
      return undefined;
    }
  }

  async setRoomLock(code: string, locked: boolean): Promise<void> {
    await supabase.from("rooms").update({ locked }).eq("code", code);
  }

  async joinRoom(code: string, user: User): Promise<boolean> {
    console.log(`Join attempt for room: [${code}] by user: ${user.nickname}`);
    const room = await this.getRoom(code);
    if (!room) {
      console.log(`Join failed: Room [${code}] not found.`);
      return false;
    }

    if (room.participants.length >= 4) {
      console.log(`Join failed: Room [${code}] is full.`);
      return false;
    }

    if (room.locked) {
      console.log(`Join failed: Room [${code}] is locked.`);
      return false;
    }

    // Set host if first user
    if (room.participants.length === 0) {
      user.isHost = true;
    } else {
      // Ensure we don't have duplicate users (e.g. on refresh)
      const exists = room.participants.find((p) => p.id === user.id);
      if (exists) {
        console.log(
          `User ${user.id} already in room ${code}, skipping join logic.`,
        );
        return true;
      }
    }

    const updatedParticipants = [...room.participants, user];

    const { error } = await supabase
      .from("rooms")
      .update({
        participants: updatedParticipants,
        last_activity: new Date().toISOString(),
      })
      .eq("code", code);

    if (error) {
      console.error("Error joining room in Supabase:", error);
      return false;
    }

    console.log(`User ${user.nickname} joined room ${code}`);
    return true;
  }

  async leaveRoom(code: string, userId: string): Promise<void> {
    const room = await this.getRoom(code);
    if (room) {
      const updatedParticipants = room.participants.filter(
        (p) => p.id !== userId,
      );

      console.log(
        `User ${userId} leaving room: ${code}. Remaining: ${updatedParticipants.length}`,
      );

      // We don't delete immediately to allow for brief disconnects/refreshes.
      // The background cleanup task will handle truly abandoned or expired rooms.
      await supabase
        .from("rooms")
        .update({
          participants: updatedParticipants,
          last_activity: new Date().toISOString(),
        })
        .eq("code", code);
    }
  }

  async addMessage(code: string, message: Message): Promise<void> {
    const room = await this.getRoom(code);
    if (room) {
      const updatedMessages = [...room.messages, message];
      await supabase
        .from("rooms")
        .update({
          messages: updatedMessages,
          last_activity: new Date().toISOString(),
        })
        .eq("code", code);
    }
  }

  async deleteMessage(code: string, messageId: string): Promise<void> {
    const room = await this.getRoom(code);
    if (room) {
      const updatedMessages = room.messages.filter((m) => m.id !== messageId);
      await supabase
        .from("rooms")
        .update({
          messages: updatedMessages,
          last_activity: new Date().toISOString(),
        })
        .eq("code", code);
    }
  }

  async addReaction(
    code: string,
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<void> {
    const room = await this.getRoom(code);
    if (!room) return;

    const messages = room.messages.map((m) => {
      if (m.id === messageId) {
        const reactions = m.reactions || [];
        const reactionIdx = reactions.findIndex((r) => r.emoji === emoji);

        if (reactionIdx > -1) {
          const reaction = reactions[reactionIdx];
          if (!reaction.users.includes(userId)) {
            reaction.users.push(userId);
            reaction.count = reaction.users.length;
          }
        } else {
          reactions.push({ emoji, count: 1, users: [userId] });
        }
        return { ...m, reactions };
      }
      return m;
    });

    await supabase.from("rooms").update({ messages }).eq("code", code);
  }

  async deleteRoom(code: string): Promise<void> {
    await supabase.from("rooms").delete().eq("code", code);
  }

  private startCleanupTask(): void {
    setInterval(async () => {
      try {
        const now = new Date().toISOString();
        const inactivityCutoff = new Date(
          Date.now() - this.INACTIVITY_LIMIT,
        ).toISOString();

        // 1. Find rooms past their expiresAt
        // 2. Find rooms past their inactivityLimit
        // 3. Find rooms with no participants past a small grace period (using last_activity)

        const { data: expiredRooms, error } = await supabase
          .from("rooms")
          .select("code, participants")
          .or(`last_activity.lt.${inactivityCutoff},expires_at.lt.${now}`);

        if (error) {
          console.error("Error in cleanup task:", error);
          return;
        }

        if (expiredRooms && expiredRooms.length > 0) {
          for (const room of expiredRooms) {
            // Extra check: only delete if participants is empty OR strictly expired
            const isNoParticipants =
              !room.participants || (room.participants as any[]).length === 0;
            const roomData = await this.getRoom(room.code);

            if (
              roomData &&
              (isNoParticipants || roomData.expiresAt < Date.now())
            ) {
              console.log(
                `Cleaning up room: ${room.code} (No participants or expired)`,
              );
              await this.deleteRoom(room.code);
            }
          }
        }
      } catch (e) {
        console.error("Exception in cleanup task:", e);
      }
    }, this.CLEANUP_INTERVAL);
  }
}

export const roomManager = new RoomManager();
