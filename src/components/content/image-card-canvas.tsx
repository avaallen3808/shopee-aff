"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Square, RectangleVertical } from "lucide-react";

interface ImageCardCanvasProps {
  imageUrl: string;
  productName: string;
  price: string;
  commissionRate: string;
  shortLink: string;
}

type CardFormat = "square" | "story";

const SIZES: Record<CardFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

export function ImageCardCanvas({
  imageUrl,
  productName,
  price,
  commissionRate,
  shortLink,
}: ImageCardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<CardFormat>("square");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [rendering, setRendering] = useState(false);
  const [ready, setReady] = useState(false);

  // Generate QR code
  useEffect(() => {
    if (!shortLink) return;
    QRCode.toDataURL(shortLink, { width: 200, margin: 1, color: { dark: "#000000", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [shortLink]);

  const renderCanvas = useCallback(async (): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = SIZES[format];
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setRendering(true);

    try {
      // Load product image
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });

      // Draw background (cover fit)
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);

      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let drawWidth = width;
      let drawHeight = height;
      let drawX = 0;
      let drawY = 0;

      if (imgRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = height * imgRatio;
        drawX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / imgRatio;
        drawY = (height - drawHeight) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Gradient overlay bottom 60%
      const overlayHeight = height * 0.6;
      const gradient = ctx.createLinearGradient(0, height - overlayHeight, 0, height);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.5, "rgba(0,0,0,0.7)");
      gradient.addColorStop(1, "rgba(0,0,0,0.95)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, height - overlayHeight, width, overlayHeight);

      // Commission badge top-right
      const badgeText = `Komisi ${commissionRate}`;
      ctx.font = "bold 32px sans-serif";
      const badgeWidth = ctx.measureText(badgeText).width + 40;
      ctx.fillStyle = "#ee4d2d";
      ctx.beginPath();
      ctx.roundRect(width - badgeWidth - 30, 30, badgeWidth, 56, 12);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, width - badgeWidth / 2 - 30, 58);

      // Product name (max 2 lines)
      ctx.font = "bold 44px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      const maxWidth = width - 80;
      const lines = wrapText(ctx, productName, maxWidth, 2);
      let textY = height - 200;
      for (const line of lines) {
        ctx.fillText(line, 40, textY);
        textY += 54;
      }

      // Price
      ctx.font = "bold 56px sans-serif";
      ctx.fillStyle = "#ee4d2d";
      ctx.fillText(price, 40, height - 120);

      // QR code bottom-right
      if (qrDataUrl) {
        const qrImg = new Image();
        await new Promise<void>((resolve) => {
          qrImg.onload = () => resolve();
          qrImg.src = qrDataUrl;
        });
        const qrSize = 160;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(width - qrSize - 50, height - qrSize - 50, qrSize + 20, qrSize + 20, 12);
        ctx.fill();
        ctx.drawImage(qrImg, width - qrSize - 40, height - qrSize - 40, qrSize, qrSize);
      }

      setReady(true);
    } catch {
      // Fallback: draw text only
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);
      ctx.font = "bold 40px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(productName, width / 2, height / 2);
      ctx.font = "bold 48px sans-serif";
      ctx.fillStyle = "#ee4d2d";
      ctx.fillText(price, width / 2, height / 2 + 70);
    } finally {
      setRendering(false);
    }
  }, [format, imageUrl, productName, price, commissionRate, qrDataUrl, shortLink]);

  // Auto-render when inputs change
  useEffect(() => {
    if (imageUrl && productName) {
      void renderCanvas();
    }
  }, [renderCanvas, imageUrl, productName]);

  function download(formatType: CardFormat): void {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shopee-card-${formatType}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image card didownload!");
    }, "image/png");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as CardFormat)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="square">Square 1080×1080</SelectItem>
              <SelectItem value="story">Story 1080×1920</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => void renderCanvas()} disabled={rendering}>
          {rendering ? <Loader2 className="h-4 w-4 animate-spin" /> : "Render"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-muted/30">
        <canvas
          ref={canvasRef}
          className="mx-auto block max-w-full"
          style={{ maxHeight: "400px", width: "auto" }}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => download("square")} disabled={!ready} variant="outline">
          <Square className="h-4 w-4" /> Download Square
        </Button>
        <Button onClick={() => download("story")} disabled={!ready} variant="outline">
          <RectangleVertical className="h-4 w-4" /> Download Story
        </Button>
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) break;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // Add ellipsis to last line if truncated
  if (lines.length === maxLines) {
    const lastLine = lines[maxLines - 1];
    if (ctx.measureText(`${lastLine}…`).width > maxWidth) {
      let truncated = lastLine;
      while (truncated.length > 0 && ctx.measureText(`${truncated}…`).width > maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      lines[maxLines - 1] = `${truncated}…`;
    } else {
      lines[maxLines - 1] = `${lastLine}…`;
    }
  }

  return lines.slice(0, maxLines);
}
