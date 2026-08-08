"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatRupiah, formatCompact, formatPercent, cn } from "@/lib/utils";
import { Loader2, Copy, TrendingUp, Star, Link2 } from "lucide-react";
import type { ProductOffer, ShopOffer, ShopeeOffer } from "@/lib/shopee/types";

interface Campaign {
  id: string;
  name: string;
  channel: string;
  subIds: string[];
}

interface GenerateLinkModalProps {
  product: ProductOffer | null;
  shop: ShopOffer | null;
  offer: ShopeeOffer | null;
  campaigns: Campaign[];
  onClose: () => void;
}

function getOriginUrl(item: ProductOffer | ShopOffer | ShopeeOffer | null): string {
  if (!item) return "";
  if ("offerLink" in item && item.offerLink) return item.offerLink;
  if ("productLink" in item && item.productLink) return item.productLink;
  if ("originalLink" in item && item.originalLink) return item.originalLink;
  return "";
}

function getProductInfo(item: ProductOffer | ShopOffer | ShopeeOffer | null): Record<string, unknown> | undefined {
  if (item && "productName" in item) {
    return {
      productName: item.productName,
      priceMin: item.priceMin,
      priceMax: item.priceMax,
      imageUrl: item.imageUrl,
      commissionRate: item.commissionRate,
      shopName: item.shopName,
    };
  }
  if (item && "offerName" in item) {
    return {
      offerName: item.offerName,
      imageUrl: item.imageUrl,
      commissionRate: item.commissionRate,
    };
  }
  if (item && "shopName" in item) {
    return {
      shopName: item.shopName,
      imageUrl: item.imageUrl,
      commissionRate: item.commissionRate,
    };
  }
  return undefined;
}

export function GenerateLinkModal({
  product,
  shop,
  offer,
  campaigns,
  onClose,
}: GenerateLinkModalProps) {
  const [campaignId, setCampaignId] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const item = product ?? shop ?? offer;
  const originUrl = getOriginUrl(item);
  const productInfo = getProductInfo(item);

  async function handleGenerate(): Promise<void> {
    setLoading(true);
    setResult(null);

    const selectedCampaign = campaigns.find((c) => c.id === campaignId);
    const subIds = selectedCampaign?.subIds ?? [];

    try {
      const res = await fetch("/api/shopee/shortlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originUrl,
          campaignId: campaignId === "none" ? undefined : campaignId,
          subIds,
          productInfo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal generate link");
        return;
      }

      setResult(data.shortLink);
      toast.success("Short link berhasil dibuat!");
    } catch {
      toast.error("Koneksi gagal");
    } finally {
      setLoading(false);
    }
  }

  function copyLink(): void {
    if (result) {
      navigator.clipboard.writeText(result);
      toast.success("Link disalin!");
    }
  }

  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Short Link</DialogTitle>
          <DialogDescription className="truncate">
            {originUrl}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pilih Campaign (opsional)</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder="Tanpa campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa campaign</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.channel})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {result && (
            <div className="space-y-2 rounded-md border bg-muted p-3">
              <Label>Short Link</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-sm">{result}</code>
                <Button size="sm" variant="outline" onClick={copyLink}>
                  <Copy className="h-3 w-3" /> Salin
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          {!result && (
            <Button onClick={handleGenerate} disabled={loading || !originUrl}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Generate
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ProductCardProps {
  product: ProductOffer;
  onGenerate: (product: ProductOffer) => void;
}

export function ProductCard({ product, onGenerate }: ProductCardProps) {
  const isTrending = product.sales > 1000;
  const isHighProfit = product.commissionRate > 5;
  const avgPrice = (product.priceMin + product.priceMax) / 2;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-muted">
        <Image
          src={product.imageUrl}
          alt={product.productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          unoptimized
        />
        {isHighProfit && (
          <Badge className="absolute left-2 top-2" variant="success">
            High Profit
          </Badge>
        )}
        <Badge className="absolute right-2 top-2" variant="default">
          {formatPercent(product.commissionRate)}
        </Badge>
      </div>
      <CardContent className="p-3">
        <p className="line-clamp-2 text-sm font-medium">{product.productName}</p>
        <p className="mt-1 text-lg font-bold text-shopee">
          {formatRupiah(avgPrice)}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {product.ratingStar.toFixed(1)}
          </span>
          {isTrending && (
            <span className="flex items-center gap-1 font-medium text-green-600">
              <TrendingUp className="h-3 w-3" />
              {formatCompact(product.sales)} terjual
            </span>
          )}
          {!isTrending && <span>{formatCompact(product.sales)} terjual</span>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground truncate">
          {product.shopName}
          {product.shopType === 1 && " · Mall"}
          {product.shopType === 2 && " · Star"}
        </p>
        <Button
          size="sm"
          className="mt-2 w-full"
          onClick={() => onGenerate(product)}
        >
          <Link2 className="h-3 w-3" /> Buat Link
        </Button>
      </CardContent>
    </Card>
  );
}

interface ShopCardProps {
  shop: ShopOffer;
  onGenerate: (shop: ShopOffer) => void;
}

export function ShopCard({ shop, onGenerate }: ShopCardProps) {
  const shopTypeLabel = shop.shopType === 1 ? "Mall" : shop.shopType === 2 ? "Star" : shop.shopType === 4 ? "Star+" : "";
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-muted">
        <Image
          src={shop.imageUrl}
          alt={shop.shopName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          unoptimized
        />
        <Badge className="absolute right-2 top-2" variant="default">
          {formatPercent(shop.commissionRate)}
        </Badge>
      </div>
      <CardContent className="p-3">
        <p className="font-medium truncate">{shop.shopName}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {shopTypeLabel && <Badge variant="secondary">{shopTypeLabel}</Badge>}
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {shop.ratingStar.toFixed(1)}
          </span>
        </div>
        <Button size="sm" className="mt-2 w-full" onClick={() => onGenerate(shop)}>
          <Link2 className="h-3 w-3" /> Buat Link
        </Button>
      </CardContent>
    </Card>
  );
}

interface OfferCardProps {
  offer: ShopeeOffer;
  onGenerate: (offer: ShopeeOffer) => void;
}

export function OfferCard({ offer, onGenerate }: OfferCardProps) {
  const now = Math.floor(Date.now() / 1000);
  const isActive = offer.periodEndTime > now;
  return (
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-md", !isActive && "opacity-60")}>
      <div className="relative aspect-video bg-muted">
        <Image
          src={offer.imageUrl}
          alt={offer.offerName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
        <Badge className="absolute right-2 top-2" variant="default">
          {formatPercent(offer.commissionRate)}
        </Badge>
      </div>
      <CardContent className="p-3">
        <p className="font-medium line-clamp-2">{offer.offerName}</p>
        {offer.offerType && (
          <Badge variant="secondary" className="mt-2">{offer.offerType}</Badge>
        )}
        <Button size="sm" className="mt-2 w-full" onClick={() => onGenerate(offer)}>
          <Link2 className="h-3 w-3" /> Buat Link
        </Button>
      </CardContent>
    </Card>
  );
}
