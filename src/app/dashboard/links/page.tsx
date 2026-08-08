"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDate, truncate } from "@/lib/utils";
import { Loader2, Plus, Copy, Trash2, Link2, Megaphone, ExternalLink } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  channel: string;
  subIds: string[];
  linkCount: number;
  createdAt: string;
}

interface LinkRecord {
  id: string;
  originUrl: string;
  shortLink: string;
  subIds: string[];
  campaign: { name: string; channel: string } | null;
  createdAt: string;
}

const CHANNEL_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "Other" },
] as const;

export default function LinksPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Campaign form
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignChannel, setCampaignChannel] = useState("instagram");
  const [campaignSubIds, setCampaignSubIds] = useState("");
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Single link form
  const [originUrl, setOriginUrl] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("none");
  const [generating, setGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Bulk form
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkResults, setBulkResults] = useState<{ url: string; shortLink?: string; error?: string }[]>([]);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  const loadCampaigns = useCallback(async (): Promise<void> => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
    } catch {
      toast.error("Gagal load campaigns");
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  const loadLinks = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/links");
      const data = await res.json();
      setLinks(data.links ?? []);
    } catch {
      toast.error("Gagal load links");
    }
  }, []);

  useEffect(() => {
    void loadCampaigns();
    void loadLinks();
  }, [loadCampaigns, loadLinks]);

  async function createCampaign(): Promise<void> {
    if (!campaignName.trim()) {
      toast.error("Nama campaign wajib diisi");
      return;
    }

    const subIds = campaignSubIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    setCreatingCampaign(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: campaignName, channel: campaignChannel, subIds }),
      });
      if (!res.ok) {
        toast.error("Gagal membuat campaign");
        return;
      }
      toast.success("Campaign dibuat!");
      setShowCampaignDialog(false);
      setCampaignName("");
      setCampaignSubIds("");
      void loadCampaigns();
    } catch {
      toast.error("Koneksi gagal");
    } finally {
      setCreatingCampaign(false);
    }
  }

  async function deleteCampaign(id: string): Promise<void> {
    try {
      await fetch(`/api/campaigns?id=${id}`, { method: "DELETE" });
      toast.success("Campaign dihapus");
      void loadCampaigns();
    } catch {
      toast.error("Gagal hapus campaign");
    }
  }

  async function generateSingleLink(): Promise<void> {
    if (!originUrl.trim()) {
      toast.error("URL wajib diisi");
      return;
    }

    setGenerating(true);
    setGeneratedLink(null);

    const campaign = campaigns.find((c) => c.id === selectedCampaign);
    const subIds = campaign?.subIds ?? [];

    try {
      const res = await fetch("/api/shopee/shortlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originUrl,
          campaignId: selectedCampaign === "none" ? undefined : selectedCampaign,
          subIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal generate link");
        return;
      }
      setGeneratedLink(data.shortLink);
      toast.success("Short link berhasil dibuat!");
      void loadLinks();
    } catch {
      toast.error("Koneksi gagal");
    } finally {
      setGenerating(false);
    }
  }

  async function generateBulkLinks(): Promise<void> {
    const urls = bulkUrls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      toast.error("Masukkan minimal 1 URL");
      return;
    }

    setBulkGenerating(true);
    setBulkResults([]);

    const campaign = campaigns.find((c) => c.id === selectedCampaign);
    const subIds = campaign?.subIds ?? [];

    // Process in batches of 5 concurrent
    const results: { url: string; shortLink?: string; error?: string }[] = [];
    for (let i = 0; i < urls.length; i += 5) {
      const batch = urls.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(async (url) => {
          try {
            const res = await fetch("/api/shopee/shortlink", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                originUrl: url,
                campaignId: selectedCampaign === "none" ? undefined : selectedCampaign,
                subIds,
              }),
            });
            const data = await res.json();
            if (!res.ok) return { url, error: data.error ?? "Failed" };
            return { url, shortLink: data.shortLink as string };
          } catch {
            return { url, error: "Connection failed" };
          }
        })
      );
      results.push(...batchResults);
      setBulkResults([...results]);
    }

    setBulkGenerating(false);
    toast.success(`Selesai: ${results.filter((r) => r.shortLink).length}/${urls.length} berhasil`);
    void loadLinks();
  }

  async function deleteLink(id: string): Promise<void> {
    try {
      await fetch(`/api/links?id=${id}`, { method: "DELETE" });
      setLinks(links.filter((l) => l.id !== id));
      toast.success("Link dihapus");
    } catch {
      toast.error("Gagal hapus link");
    }
  }

  function copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    toast.success("Disalin!");
  }

  const channelLabel = (ch: string): string =>
    CHANNEL_OPTIONS.find((o) => o.value === ch)?.label ?? ch;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Links & Campaigns</h1>
        <p className="mt-1 text-muted-foreground">
          Generate short link dengan campaign tracking per channel
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Campaign sidebar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Campaigns</CardTitle>
              <CardDescription>Track per channel</CardDescription>
            </div>
            <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline"><Plus className="h-4 w-4" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Campaign Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Campaign</Label>
                    <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Promo Lebaran" />
                  </div>
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select value={campaignChannel} onValueChange={setCampaignChannel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CHANNEL_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>subIds (max 5, comma-separated)</Label>
                    <Input value={campaignSubIds} onChange={(e) => setCampaignSubIds(e.target.value)} placeholder="e.g. instagram,stories,promo-lebaran" />
                    <p className="text-xs text-muted-foreground">
                      subIds muncul di utmContent conversion report untuk channel attribution
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>Batal</Button>
                  <Button onClick={createCampaign} disabled={creatingCampaign}>
                    {creatingCampaign && <Loader2 className="h-4 w-4 animate-spin" />}
                    Buat
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingCampaigns ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada campaign. Klik + untuk buat.</p>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{channelLabel(c.channel)}</Badge>
                      <span className="text-xs text-muted-foreground">{c.linkCount} links</span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => void deleteCampaign(c.id)}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Link generator */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" /> Link Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-2">
                <Label>Campaign (opsional)</Label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa campaign</SelectItem>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({channelLabel(c.channel)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="single">
                <TabsList>
                  <TabsTrigger value="single">Single</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk</TabsTrigger>
                </TabsList>

                <TabsContent value="single" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Product URL</Label>
                    <Input
                      value={originUrl}
                      onChange={(e) => setOriginUrl(e.target.value)}
                      placeholder="https://shopee.co.id/product-i.123.456"
                    />
                  </div>
                  <Button onClick={generateSingleLink} disabled={generating}>
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Generate Link
                  </Button>
                  {generatedLink && (
                    <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                      <code className="flex-1 truncate text-sm">{generatedLink}</code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedLink)}>
                        <Copy className="h-3 w-3" /> Salin
                      </Button>
                      <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost"><ExternalLink className="h-3 w-3" /></Button>
                      </a>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="bulk" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Multiple URLs (one per line)</Label>
                    <Textarea
                      value={bulkUrls}
                      onChange={(e) => setBulkUrls(e.target.value)}
                      placeholder={"https://shopee.co.id/product-i.123.456\nhttps://shopee.co.id/product-i.789.012"}
                      rows={5}
                    />
                  </div>
                  <Button onClick={generateBulkLinks} disabled={bulkGenerating}>
                    {bulkGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Generate Bulk
                  </Button>
                  {bulkResults.length > 0 && (
                    <div className="space-y-2">
                      {bulkResults.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                          <span className="flex-1 truncate text-muted-foreground">{truncate(r.url, 40)}</span>
                          {r.shortLink ? (
                            <>
                              <code className="text-sm">{r.shortLink}</code>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(r.shortLink!)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-destructive">{r.error}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Link history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4" /> Link History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {links.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada link. Generate link pertama Anda.</p>
              ) : (
                <div className="space-y-2">
                  {links.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 rounded-md border p-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <code className="truncate text-sm font-medium">{link.shortLink}</code>
                          {link.campaign && (
                            <Badge variant="secondary" className="text-xs">{channelLabel(link.campaign.channel)}</Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{link.originUrl}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(link.createdAt, true)}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(link.shortLink)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void deleteLink(link.id)}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
