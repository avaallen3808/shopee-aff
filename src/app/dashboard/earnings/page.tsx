"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Download, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import type {
  ConversionReportResponse,
  ConversionReportNode,
  ValidatedReportResponse,
  ValidatedReportNode,
} from "@/lib/shopee/types";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  COMPLETED: "success",
  PENDING: "warning",
  UNPAID: "secondary",
  CANCELLED: "destructive",
};

export default function EarningsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conversion report
  const [days, setDays] = useState("30");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conversions, setConversions] = useState<ConversionReportNode[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Validated report
  const [validationId, setValidationId] = useState("");
  const [validated, setValidated] = useState<ValidatedReportNode[]>([]);
  const [validatedLoading, setValidatedLoading] = useState(false);
  const [validatedError, setValidatedError] = useState<string | null>(null);

  const toggleRow = useCallback((id: string): void => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const fetchConversions = useCallback(async (): Promise<void> => {
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
        if (statusFilter !== "all") params.set("orderStatus", statusFilter);
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
    } catch {
      setError("Koneksi gagal");
    } finally {
      setLoading(false);
    }
  }, [days, statusFilter]);

  const fetchValidated = useCallback(async (): Promise<void> => {
    if (!validationId.trim()) {
      toast.error("Masukkan Validation ID");
      return;
    }
    setValidatedLoading(true);
    setValidatedError(null);
    setValidated([]);

    try {
      const allNodes: ValidatedReportNode[] = [];
      let scrollId: string | undefined;

      for (let i = 0; i < 10; i++) {
        const params = new URLSearchParams();
        params.set("validationId", validationId);
        params.set("limit", "500");
        if (scrollId) params.set("scrollId", scrollId);

        const res = await fetch(`/api/shopee/validated?${params}`);
        const data: ValidatedReportResponse = await res.json();

        if (!res.ok) {
          const err = data as unknown as { error?: string };
          setValidatedError(err.error ?? "Gagal fetch validated report");
          return;
        }

        allNodes.push(...data.nodes);
        if (!data.pageInfo.hasNextPage || !data.pageInfo.scrollId) break;
        scrollId = data.pageInfo.scrollId;
      }

      setValidated(allNodes);
      toast.success(`${allNodes.length} records loaded`);
    } catch {
      setValidatedError("Koneksi gagal");
    } finally {
      setValidatedLoading(false);
    }
  }, [validationId]);

  function exportCSV(): void {
    const headers = ["conversionId", "purchaseTime", "totalCommission", "netCommission", "buyerType", "device", "utmContent"];
    const rows = conversions.map((c) => [
      c.conversionId,
      new Date(c.purchaseTime * 1000).toISOString(),
      c.totalCommission,
      c.netCommission,
      c.buyerType,
      c.device,
      c.utmContent,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  }

  function exportValidatedCSV(): void {
    if (validated.length === 0) return;
    const headers = ["conversionId", "purchaseTime", "totalCommission", "netCommission"];
    const rows = validated.map((v) => [
      v.conversionId,
      new Date(v.purchaseTime * 1000).toISOString(),
      v.totalCommission,
      v.netCommission,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `validated-${validationId}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  }

  const totalCommission = useMemo(
    () => conversions.reduce((sum, c) => sum + c.totalCommission, 0),
    [conversions]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="mt-1 text-muted-foreground">Conversion & validated commission report</p>
      </div>

      <Tabs defaultValue="conversion">
        <TabsList>
          <TabsTrigger value="conversion">Conversion Report</TabsTrigger>
          <TabsTrigger value="validated">Validated Report</TabsTrigger>
        </TabsList>

        {/* Conversion Report Tab */}
        <TabsContent value="conversion" className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Range</Label>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Hari</SelectItem>
                  <SelectItem value="30">30 Hari</SelectItem>
                  <SelectItem value="90">90 Hari</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchConversions} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
            </Button>
            {conversions.length > 0 && (
              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            )}
            {conversions.length > 0 && (
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">Total Komisi</p>
                <p className="text-xl font-bold text-shopee">{formatRupiah(totalCommission)}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : conversions.length === 0 && !error ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Klik Fetch untuk load conversion report
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {conversions.map((conv) => {
                const isExpanded = expandedRows.has(conv.conversionId);
                return (
                  <div key={conv.conversionId} className="rounded-md border">
                    <button
                      onClick={() => toggleRow(conv.conversionId)}
                      className="flex w-full items-center gap-3 p-3 text-left hover:bg-accent/50"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{conv.conversionId}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(conv.purchaseTime, true)}</p>
                      </div>
                      <Badge variant={STATUS_VARIANT[conv.campaignType] ?? "secondary"} className="text-xs">
                        {conv.campaignType || "UNKNOWN"}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatRupiah(conv.totalCommission)}</p>
                        <p className="text-xs text-muted-foreground">{conv.buyerType} · {conv.device}</p>
                      </div>
                    </button>
                    {isExpanded && conv.orders.length > 0 && (
                      <div className="border-t bg-muted/30 p-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-muted-foreground">
                              <th className="pb-2">Item</th>
                              <th className="pb-2">Shop</th>
                              <th className="pb-2 text-right">Price</th>
                              <th className="pb-2 text-right">Qty</th>
                              <th className="pb-2 text-right">Commission</th>
                            </tr>
                          </thead>
                          <tbody>
                            {conv.orders.flatMap((o, oi) =>
                              o.items.map((item, ii) => (
                                <tr key={`${oi}-${ii}`} className="border-t">
                                  <td className="py-2 max-w-[200px] truncate">{item.itemName}</td>
                                  <td className="py-2">{item.shopName}</td>
                                  <td className="py-2 text-right">{formatRupiah(item.itemPrice)}</td>
                                  <td className="py-2 text-right">{item.quantity}</td>
                                  <td className="py-2 text-right font-medium">{formatRupiah(item.itemTotalCommission)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Validated Report Tab */}
        <TabsContent value="validated" className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label className="text-xs">Validation ID</Label>
              <Input
                value={validationId}
                onChange={(e) => setValidationId(e.target.value)}
                placeholder="Masukkan validation ID"
              />
            </div>
            <Button onClick={fetchValidated} disabled={validatedLoading}>
              {validatedLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
            </Button>
            {validated.length > 0 && (
              <Button variant="outline" onClick={exportValidatedCSV}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            )}
          </div>

          {validatedError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {validatedError}
            </div>
          )}

          {validatedLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : validated.length === 0 && !validatedError ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Masukkan Validation ID dan klik Fetch untuk load validated commission
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {validated.map((v) => (
                <div key={v.conversionId} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{v.conversionId}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(v.purchaseTime, true)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{formatRupiah(v.netCommission)}</p>
                    <p className="text-xs text-muted-foreground">Net (validated)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
