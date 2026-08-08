"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Copy, Sparkles, Download } from "lucide-react";
import { generateCaption, PLATFORM_LABELS, TONE_LABELS, type Platform, type Tone } from "@/lib/caption-templates";
import { ImageCardCanvas } from "@/components/content/image-card-canvas";

interface LinkRecord {
  id: string;
  originUrl: string;
  shortLink: string;
  productInfo: {
    productName?: string;
    priceMin?: number;
    priceMax?: number;
    imageUrl?: string;
    commissionRate?: number;
    shopName?: string;
    offerName?: string;
  } | null;
  createdAt: string;
}

export default function ContentPage() {
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string>("none");

  // Caption inputs
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tone, setTone] = useState<Tone>("persuasive");
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [shortLink, setShortLink] = useState("");
  const [rating, setRating] = useState("4.8");
  const [shopName, setShopName] = useState("");
  const [caption, setCaption] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedCaption, setEnhancedCaption] = useState<string | null>(null);

  // Image card inputs
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    fetch("/api/links")
      .then((r) => r.json())
      .then((data: { links: LinkRecord[] }) => setLinks(data.links ?? []))
      .catch(() => undefined);
  }, []);

  const selectLink = useCallback((linkId: string): void => {
    setSelectedLinkId(linkId);
    if (linkId === "none") return;
    const link = links.find((l) => l.id === linkId);
    if (!link) return;
    setShortLink(link.shortLink);
    const info = link.productInfo;
    if (info) {
      if (info.productName) setProductName(info.productName);
      if (info.offerName && !info.productName) setProductName(info.offerName);
      if (info.priceMin) setPrice(`Rp ${info.priceMin.toLocaleString("id-ID")}`);
      if (info.commissionRate) setCommissionRate(`${info.commissionRate}%`);
      if (info.imageUrl) setImageUrl(info.imageUrl);
      if (info.shopName) setShopName(info.shopName);
    }
  }, [links]);

  function handleGenerateCaption(): void {
    if (!productName || !shortLink) {
      toast.error("Isi nama produk dan short link");
      return;
    }
    const generated = generateCaption(platform, tone, {
      productName,
      price: price || "-",
      commissionRate: commissionRate || "-",
      shortLink,
      rating,
      shopName: shopName || "-",
    });
    setCaption(generated);
    setEnhancedCaption(null);
  }

  async function handleEnhance(): Promise<void> {
    if (!caption) {
      toast.error("Generate caption dulu");
      return;
    }
    setEnhancing(true);
    try {
      const res = await fetch("/api/content/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          platform,
          tone,
          productInfo: { productName, price },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "AI_NOT_CONFIGURED") {
          toast.error("Set OPENAI_API_KEY di Settings untuk AI enhancement");
        } else {
          toast.error(data.error ?? "Gagal enhance caption");
        }
        return;
      }
      setEnhancedCaption(data.enhanced);
      toast.success("Caption ditingkatkan dengan AI!");
    } catch {
      toast.error("Koneksi gagal");
    } finally {
      setEnhancing(false);
    }
  }

  function copyText(text: string): void {
    navigator.clipboard.writeText(text);
    toast.success("Disalin!");
  }

  const displayCaption = enhancedCaption ?? caption;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Studio</h1>
        <p className="mt-1 text-muted-foreground">
          Buat caption dan image card untuk multi-channel promotion
        </p>
      </div>

      {/* Product selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilih Produk dari Link History</CardTitle>
          <CardDescription>Auto-fill product info dari link yang sudah dibuat</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedLinkId} onValueChange={selectLink}>
            <SelectTrigger><SelectValue placeholder="Pilih link..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Manual input</SelectItem>
              {links.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.productInfo?.productName ?? l.shortLink}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Caption Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Caption Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Platform</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TONE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Product Name</Label>
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. TWS Earbuds Pro" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Price</Label>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Rp 99.000" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Commission Rate</Label>
                <Input value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} placeholder="5%" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Rating</Label>
                <Input value={rating} onChange={(e) => setRating(e.target.value)} placeholder="4.8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Shop Name</Label>
                <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Official Store" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Short Link</Label>
              <Input value={shortLink} onChange={(e) => setShortLink(e.target.value)} placeholder="https://shope.ee/..." />
            </div>

            <Button onClick={handleGenerateCaption} className="w-full">
              <Sparkles className="h-4 w-4" /> Generate Caption
            </Button>

            {displayCaption && (
              <div className="space-y-2">
                <div className="relative">
                  <Textarea value={displayCaption} readOnly rows={8} className="resize-none" />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute right-2 top-2"
                    onClick={() => copyText(displayCaption)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {enhancedCaption && (
                  <p className="text-xs text-muted-foreground">✨ AI-enhanced</p>
                )}
                {!enhancedCaption && caption && (
                  <Button onClick={handleEnhance} variant="outline" size="sm" disabled={enhancing}>
                    {enhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Tingkatkan dengan AI
                  </Button>
                )}
                {enhancedCaption && (
                  <Button onClick={() => setEnhancedCaption(null)} variant="ghost" size="sm">
                    Reset ke template
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Card Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Image Card Generator</CardTitle>
            <CardDescription>Export PNG untuk Instagram/TikTok</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Product Image URL</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Product Name</Label>
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Product name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Price</Label>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Rp 99.000" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Commission</Label>
                <Input value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} placeholder="5%" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Short Link (for QR)</Label>
              <Input value={shortLink} onChange={(e) => setShortLink(e.target.value)} placeholder="https://shope.ee/..." />
            </div>

            {imageUrl && productName ? (
              <ImageCardCanvas
                imageUrl={imageUrl}
                productName={productName}
                price={price}
                commissionRate={commissionRate}
                shortLink={shortLink}
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                <div className="text-center">
                  <Download className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">Isi image URL & product name untuk preview</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
