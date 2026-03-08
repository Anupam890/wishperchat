"use client";

import { Paperclip } from "lucide-react";
import { useRef } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="p-1.5 text-muted-text hover:text-text transition-colors rounded-full hover:bg-black/5 disabled:opacity-50"
      >
        <Paperclip className="size-6 stroke-[1.5]" />
      </button>
    </>
  );
}
