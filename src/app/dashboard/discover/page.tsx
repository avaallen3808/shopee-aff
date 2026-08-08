"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { Search, Loader2, AlertCircle } from "lucide-react";
import {
  ProductCard,
  ShopCard,
  OfferCard,
  GenerateLinkModal,
} from "@/components/discover/discover-cards";
import type { ProductOffer, ShopOffer, ShopeeOffer, ProductOfferResponse, ShopOfferResponse, ShopeeOfferResponse } from "@/lib/shopee/types";

interface Campaign {
  id: string;
  name: string;
  channel: string;
  subIds: string[];
}

export default function DiscoverPage() {
  const [keyword, setKeyword] = useState("");
  const [sortType, setSortType] = useState("5"); // default: commission highest
  const [shopType, setShopType] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductOffer[]>([]);
  const [shops, setShops] = useState<ShopOffer[]>([]);
  const [offers, setOffers] = useState<ShopeeOffer[]>([]);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [productPage, setProductPage] = useState(1);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [genProduct, setGenProduct] = useState<ProductOffer | null>(null);
  const [genShop, setGenShop] = useState<ShopOffer | null>(null);
  const [genOffer, setGenOffer] = useState<ShopeeOffer | null>(null);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data: { campaigns: Campaign[] }) => setCampaigns(data.campaigns ?? []))
      .catch(() => undefined);
  }, []);

  const searchProducts = useCallback(
    async (page: number, append: boolean): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (keyword) params.set("keyword", keyword);
        if (sortType !== "0") params.set("sortType", sortType);
        if (shopType !== "0") params.set("shopType", shopType);
        params.set("page", String(page));
        params.set("limit", "20");

        const res = await fetch(`/api/shopee/products?${params}`);
        const data: ProductOfferResponse = await res.json();

        if (!res.ok) {
          const err = data as unknown as { error?: string };
          if (err.error === "SHOPEE_CRED_NOT_SET") {
            setError("Set Shopee API credentials di Settings dulu");
          } else {
            setError(err.error ?? "Gagal fetch products");
          }
          return;
        }

        setProducts(append ? [...products, ...data.nodes] : data.nodes);
        setHasMoreProducts(data.pageInfo.hasNextPage);
        setProductPage(page);
      } catch {
        setError("Koneksi gagal");
      } finally {
        setLoading(false);
      }
    },
    [keyword, sortType, shopType, products]
  );

  const searchShops = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);
      if (shopType !== "0") params.set("shopType", shopType);
      params.set("limit", "20");

      const res = await fetch(`/api/shopee/shops?${params}`);
      const data: ShopOfferResponse = await res.json();

      if (!res.ok) {
        const err = data as unknown as { error?: string };
        if (err.error === "SHOPEE_CRED_NOT_SET") {
          setError("Set Shopee API credentials di Settings dulu");
        } else {
          setError(err.error ?? "Gagal fetch shops");
        }
        return;
      }
      setShops(data.nodes);
    } catch {
      setError("Koneksi gagal");
    } finally {
      setLoading(false);
    }
  }, [keyword, shopType]);

  const searchOffers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);
      params.set("limit", "20");

      const res = await fetch(`/api/shopee/offers?${params}`);
      const data: ShopeeOfferResponse = await res.json();

      if (!res.ok) {
        const err = data as unknown as { error?: string };
        if (err.error === "SHOPEE_CRED_NOT_SET") {
          setError("Set Shopee API credentials di Settings dulu");
        } else {
          setError(err.error ?? "Gagal fetch offers");
        }
        return;
      }
      setOffers(data.nodes);
    } catch {
      setError("Koneksi gagal");
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  function handleSearch(): void {
    setProducts([]);
    setProductPage(1);
    void searchProducts(1, false);
  }

  function handleTabChange(tab: string): void {
    setError(null);
    if (tab === "products" && products.length === 0) void searchProducts(1, false);
    if (tab === "shops" && shops.length === 0) void searchShops();
    if (tab === "offers" && offers.length === 0) void searchOffers();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
        <p className="mt-1 text-muted-foreground">
          Cari produk, shop, dan Shopee offers dengan komisi terbaik
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] space-y-1">
          <Label className="text-xs">Keyword</Label>
          <Input
            placeholder="Cari produk atau shop..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sort</Label>
          <Select value={sortType} onValueChange={setSortType}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Relevan</SelectItem>
              <SelectItem value="1">Terlaris</SelectItem>
              <SelectItem value="2">Harga ↑</SelectItem>
              <SelectItem value="3">Harga ↓</SelectItem>
              <SelectItem value="5">Komisi ↑</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Shop Type</Label>
          <Select value={shopType} onValueChange={setShopType}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Semua</SelectItem>
              <SelectItem value="1">Mall</SelectItem>
              <SelectItem value="2">Star</SelectItem>
              <SelectItem value="4">Star+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Cari
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Tabs defaultValue="products" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="shops">Shops</TabsTrigger>
          <TabsTrigger value="offers">Shopee Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
              ))}
            </div>
          ) : products.length === 0 && !error ? (
            <p className="py-12 text-center text-muted-foreground">
              Ketik keyword dan klik Cari untuk menemukan produk
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.itemId} product={p} onGenerate={setGenProduct} />
                ))}
              </div>
              {hasMoreProducts && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => void searchProducts(productPage + 1, true)}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="shops" className="space-y-4">
          {loading && shops.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : shops.length === 0 && !error ? (
            <p className="py-12 text-center text-muted-foreground">
              Ketik keyword dan klik Cari untuk menemukan shop
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {shops.map((s) => (
                <ShopCard key={s.shopId} shop={s} onGenerate={setGenShop} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          {loading && offers.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-lg" />
              ))}
            </div>
          ) : offers.length === 0 && !error ? (
            <p className="py-12 text-center text-muted-foreground">
              Klik Cari untuk melihat Shopee Offers (Flash Sale, Mall promo, dll)
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {offers.map((o, i) => (
                <OfferCard key={`${o.offerName}-${i}`} offer={o} onGenerate={setGenOffer} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <GenerateLinkModal
        product={genProduct}
        shop={genShop}
        offer={genOffer}
        campaigns={campaigns}
        onClose={() => {
          setGenProduct(null);
          setGenShop(null);
          setGenOffer(null);
        }}
      />
    </div>
  );
}
