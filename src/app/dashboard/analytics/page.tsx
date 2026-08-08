"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { Loader2, TrendingUp, Wallet, ShoppingBag, Users, AlertCircle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { formatRupiah, formatNumber } from "@/lib/utils";
import type { ConversionReportResponse, ConversionReportNode } from "@/lib/shopee/types";

interface LinkRecord {
  id: string;
  subIds: string[];
  campaign: { name: string; channel: string } | null;
}

const COLORS = ["#ee4d2d", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"];



const DATE_RANGES = [
  { value: "7", label: "7 Hari" },
  { value: "30", label: "30 Hari" },
  { value: "90", label: "90 Hari" },
] as const;

export default function AnalyticsPage() {
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversions, setConversions] = useState<ConversionReportNode[]>([]);
  const [links, setLinks] = useState<LinkRecord[]>([]);

  const loadLinks = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/links");
      const data = await res.json();
      setLinks(data.links ?? []);
    } catch {
      // silent
    }
  }, []);

  void loadLinks;

  const fetchAnalytics = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const now = Math.floor(Date.now() / 1000);
      const start = now - parseInt(days) * 86400;
      const allNodes: ConversionReportNode[] = [];
      let scrollId: string | undefined;

      for (let i = 0; i < 10; i++) {
        const params = new URLSearchParams();
        params.set("purchaseTimeStart", String(start));
        params.set("purchaseTimeEnd", String(now));
        params.set("limit", "500");
        if (scrollId) params.set("scrollId", scrollId);

        const res = await fetch(`/api/shopee/conversions?${params}`);
        const data: ConversionReportResponse = await res.json();

        if (!res.ok) {
          const err = data as unknown as { error?: string };
          if (err.error === "SHOPEE_CRED_NOT_SET") {
            setError("Set Shopee API credentials di Settings dulu");
          } else {
            setError(err.error ?? "Gagal fetch conversions");
          }
          return;
        }

        allNodes.push(...data.nodes);
        if (!data.pageInfo.hasNextPage || !data.pageInfo.scrollId) break;
        scrollId = data.pageInfo.scrollId;
      }

      setConversions(allNodes);
      void loadLinks();
    } catch {
      setError("Koneksi gagal");
    } finally {
      setLoading(false);
    }
  }, [days, loadLinks]);

  const stats = useMemo(() => {
    if (conversions.length === 0) {
      return { totalCommission: 0, completedCommission: 0, totalOrders: 0, avgCommission: 0, indirectOrders: 0 };
    }

    const totalCommission = conversions.reduce((sum, c) => sum + c.totalCommission, 0);
    const completedCommission = conversions
      .filter((c) => c.orders.length > 0)
      .reduce((sum, c) => sum + c.netCommission, 0);
    const totalOrders = conversions.length;
    const avgCommission = totalCommission / totalOrders;

    // Indirect orders: orders where items have attributionType != same shop
    const indirectOrders = conversions.filter((c) =>
      c.orders.some((o) =>
        o.items.some((item) =>
          item.attributionType && item.attributionType !== "Ordered in Same Shop"
        )
      )
    ).length;

    return { totalCommission, completedCommission, totalOrders, avgCommission, indirectOrders };
  }, [conversions]);

  const revenueTrend = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const c of conversions) {
      const date = new Date(c.purchaseTime * 1000).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      byDate.set(date, (byDate.get(date) ?? 0) + c.totalCommission);
    }
    return Array.from(byDate.entries()).map(([date, value]) => ({ date, value }));
  }, [conversions]);



  const channelAttribution = useMemo(() => {
    const byChannel = new Map<string, { konversi: number; komisi: number }>();

    for (const c of conversions) {
      const utm = c.utmContent || "";
      // Try to match link by subIds
      const matchedLink = links.find((l) => {
        const linkUtm = l.subIds.join(",");
        return utm && linkUtm && (utm === linkUtm || utm.includes(linkUtm) || linkUtm.includes(utm));
      });

      const channel = matchedLink?.campaign?.channel ?? "Unattributed";

      const existing = byChannel.get(channel) ?? { konversi: 0, komisi: 0 };
      existing.konversi += 1;
      existing.komisi += c.totalCommission;
      byChannel.set(channel, existing);
    }

    return Array.from(byChannel.entries()).map(([channel, data]) => ({
      channel,
      konversi: data.konversi,
      komisi: data.komisi,
    }));
  }, [conversions, links]);

  const deviceSplit = useMemo(() => {
    const byDevice = new Map<string, number>();
    for (const c of conversions) {
      const device = c.device || "Unknown";
      byDevice.set(device, (byDevice.get(device) ?? 0) + 1);
    }
    return Array.from(byDevice.entries()).map(([name, value]) => ({ name, value }));
  }, [conversions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-muted-foreground">Performa & channel attribution</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Range</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchAnalytics} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Komisi"
          value={formatRupiah(stats.totalCommission)}
          icon={Wallet}
          loading={loading}
        />
        <StatCard
          title="Komisi Selesai"
          value={formatRupiah(stats.completedCommission)}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Total Konversi"
          value={formatNumber(stats.totalOrders)}
          icon={ShoppingBag}
          loading={loading}
        />
        <StatCard
          title="Avg Komisi/Order"
          value={formatRupiah(stats.avgCommission)}
          icon={Wallet}
          loading={loading}
        />
        <StatCard
          title="Indirect Orders"
          value={formatNumber(stats.indirectOrders)}
          icon={Users}
          loading={loading}
        />
      </div>

      {loading && conversions.length === 0 ? (
        <div className="space-y-4">
          <Skeleton className="h-[300px] rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-[250px] rounded-lg" />
            <Skeleton className="h-[250px] rounded-lg" />
          </div>
        </div>
      ) : conversions.length === 0 && !error ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Belum ada data konversi. Klik Refresh untuk fetch dari Shopee API.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Trend</CardTitle>
              <CardDescription>Total commission per hari</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value: number) => formatRupiah(value)} />
                  <Line type="monotone" dataKey="value" stroke="#ee4d2d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Channel Attribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Channel Attribution</CardTitle>
                <CardDescription>Komisi per channel</CardDescription>
              </CardHeader>
              <CardContent>
                {channelAttribution.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={channelAttribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="channel" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(value: number) => formatRupiah(value)} />
                      <Bar dataKey="komisi" fill="#ee4d2d" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Device Split */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Device Split</CardTitle>
                <CardDescription>APP vs WEB</CardDescription>
              </CardHeader>
              <CardContent>
                {deviceSplit.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={deviceSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {deviceSplit.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Channel attribution table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Channel Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {channelAttribution.map((ch) => (
                  <div key={ch.channel} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={ch.channel === "Unattributed" ? "outline" : "default"}>
                        {ch.channel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{ch.konversi} konversi</span>
                      <span className="font-semibold">{formatRupiah(ch.komisi)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}

function StatCard({ title, value, icon: Icon, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-24" />
        ) : (
          <p className="mt-2 text-xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
