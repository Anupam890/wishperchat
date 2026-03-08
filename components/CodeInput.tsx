"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  disabled?: boolean;
}

export function CodeInput({
  value,
  onChange,
  onComplete,
  disabled,
}: CodeInputProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <InputOTP
        maxLength={6}
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        disabled={disabled}
      >
        <InputOTPGroup className="gap-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot
              key={index}
              index={index}
              className="size-12 md:size-16 text-2xl font-bold bg-white/40 sketch-border border-text/20 focus:border-primary focus:ring-0 transition-all"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
