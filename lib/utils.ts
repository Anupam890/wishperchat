import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const NICKNAMES = [
  "Tawny Tiger",
  "Sand Owl",
  "Rusty Fox",
  "Golden Panda",
  "Wood Wolf",
  "Bronze Dragon",
  "Clay Cat",
  "Ochre Snake",
  "Dusty Bear",
  "Amber Lion",
  "Sepia Hawk",
  "Sienna Raven",
];

export function getRandomNickname(): string {
  return NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
}
