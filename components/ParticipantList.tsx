import { User } from "@/lib/types";
import { Users, Shield, Circle } from "lucide-react";

interface ParticipantListProps {
  participants: User[];
}

export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <div className="flex flex-col gap-6 p-6 min-w-[240px] border-l-2 border-border/30 bg-secondary-bg/20 hidden lg:flex paper-texture">
      <div className="flex items-center gap-2 text-sm font-black text-muted-text uppercase tracking-[0.2em] font-caveat">
        <Users className="size-5" />
        <span className="text-xl">Scribblers</span>
        <span className="ml-auto text-lg">({participants.length}/4)</span>
      </div>

      <div className="flex flex-col gap-4">
        {participants.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 px-3 py-2 sketch-border-sm bg-white/40 hover:bg-white/60 transition-colors group cursor-default"
          >
            <div className="relative">
              <div className="size-10 rounded-full bg-primary/20 sketch-border flex items-center justify-center text-primary font-black text-lg font-caveat">
                {user.nickname.split(" ")[0][0]}
                {user.nickname.split(" ")[1][0]}
              </div>
              <Circle className="size-3.5 fill-success stroke-background absolute -bottom-0.5 -right-0.5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-lg font-hand font-bold truncate leading-tight">
                {user.nickname}
              </span>
              {user.isHost && (
                <span className="text-[10px] text-accent flex items-center gap-1 font-black uppercase tracking-widest bg-accent/10 px-1 rounded animate-pulse">
                  <Shield className="size-2.5" /> Warden
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto opacity-30 select-none">
        <svg viewBox="0 0 200 100" className="w-full">
          <path
            d="M10,50 Q50,10 90,50 T170,50"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <circle cx="10" cy="50" r="3" fill="currentColor" />
          <circle cx="170" cy="50" r="3" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
