import type { Metadata } from "next";
import "./globals.css";
import { SocketProvider } from "@/context/SocketContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "WhisperChat | Doodle Anonymous Chat",
  description:
    "Private conversations that disappear, styled in a cozy notebook.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-text transition-colors">
        <SocketProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              className: "sketch-border-sm bg-secondary-bg text-text",
            }}
          />
        </SocketProvider>
      </body>
    </html>
  );
}
