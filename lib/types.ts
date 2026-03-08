export interface User {
  id: string;
  nickname: string;
  isHost?: boolean;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: "text" | "file" | "system" | "whisper" | "sticker";
  fileUrl?: string;
  fileName?: string;
  replyToId?: string;
  replyToSenderName?: string;
  replyToContent?: string;
  reactions?: Reaction[];
  selfDestructAt?: number;
  isViewOnce?: boolean;
  recipientId?: string;
}

export interface RoomState {
  code: string;
  participants: User[];
  isLocked: boolean;
  maxParticipants: number;
  expiresAt: number;
}
