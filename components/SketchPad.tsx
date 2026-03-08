"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Pencil, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Socket } from "socket.io-client";
import { cn } from "@/lib/utils";

interface SketchPadProps {
  socket: Socket | null;
  roomCode: string;
}

export function SketchPad({ socket, roomCode }: SketchPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");
  const [color, setColor] = useState("#4A3F35"); // Graphite brown
  const [brushSize, setBrushSize] = useState(4);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    contextRef.current = ctx;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Save current drawing
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx?.drawImage(canvas, 0, 0);

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.drawImage(tempCanvas, 0, 0);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    if (socket) {
      socket.on("draw_data", (data: any) => {
        const {
          x,
          y,
          lastX,
          lastY,
          tool: rTool,
          color: rColor,
          size: rSize,
        } = data;
        if (!contextRef.current) return;

        const c = contextRef.current;
        c.beginPath();
        c.strokeStyle = rTool === "eraser" ? "#FDFBF7" : rColor; // Paper color for eraser
        c.lineWidth = rSize;
        c.moveTo(lastX, lastY);
        c.lineTo(x, y);
        c.stroke();
        c.closePath();
      });

      socket.on("clear_board", () => {
        if (!contextRef.current || !canvasRef.current) return;
        contextRef.current.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height,
        );
      });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      socket?.off("draw_data");
      socket?.off("clear_board");
    };
  }, [socket]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoordinates(e);
    lastPos.current = { x, y };
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;

    const { x, y } = getCoordinates(e);
    const ctx = contextRef.current;

    ctx.beginPath();
    ctx.strokeStyle = tool === "eraser" ? "#FDFBF7" : color;
    ctx.lineWidth = brushSize;
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();

    if (socket) {
      socket.emit("draw", {
        roomCode,
        data: {
          x,
          y,
          lastX: lastPos.current.x,
          lastY: lastPos.current.y,
          tool,
          color,
          size: brushSize,
        },
      });
    }

    lastPos.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !contextRef.current) return;
    contextRef.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );
    socket?.emit("clear_board", { roomCode });
  };

  const downloadCanvas = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `whisper-scribble-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FDFBF7] sketch-border m-4 overflow-hidden relative paper-texture sketch-shadow-lg">
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <div className="flex gap-1 bg-white/80 p-1.5 sketch-border-sm backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTool("pencil")}
            className={cn(
              "size-9 transition-all",
              tool === "pencil"
                ? "bg-primary/20 sketch-border-sm scale-110"
                : "opacity-50",
            )}
          >
            <Pencil className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTool("eraser")}
            className={cn(
              "size-9 transition-all",
              tool === "eraser"
                ? "bg-primary/20 sketch-border-sm scale-110"
                : "opacity-50",
            )}
          >
            <Eraser className="size-5" />
          </Button>
          <div className="w-[1px] bg-border/20 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={clearCanvas}
            className="size-9 hover:text-error transition-colors"
          >
            <Trash2 className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={downloadCanvas}
            className="size-9 hover:text-accent transition-colors"
          >
            <Download className="size-5" />
          </Button>
        </div>

        <div className="flex flex-col gap-3 bg-white/80 p-3 sketch-border-sm backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-text/50">
              Brush Size
            </span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="accent-primary h-1"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-text/50">
              Graphite Colors
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                "#4A3F35",
                "#70665D",
                "#2C3E50",
                "#E67E22",
                "#E74C3C",
                "#27AE60",
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setTool("pencil");
                  }}
                  className={cn(
                    "size-5 sketch-border-sm transition-transform hover:scale-125",
                    color === c && tool === "pencil"
                      ? "scale-125 ring-2 ring-primary ring-offset-2"
                      : "",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-4 pointer-events-none">
        <span className="font-caveat font-bold text-muted-text/30 text-4xl select-none">
          Scribble Area
        </span>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="flex-1 cursor-crosshair touch-none"
      />
    </div>
  );
}
