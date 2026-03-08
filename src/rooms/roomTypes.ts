export interface User {
  id: string;
  nickname: string;
  isHost: boolean;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // User IDs who reacted
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: "text" | "file" | "system" | "whisper";
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

export interface Room {
  code: string;
  participants: User[];
  messages: Message[];
  createdAt: number;
  lastActivity: number;
  locked: boolean;
  expiresAt: number;
}
