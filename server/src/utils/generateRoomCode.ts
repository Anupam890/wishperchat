/**
 * Generates a random 6-digit numeric room code.
 */
export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
