"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, KeyRound, Sparkles, Lock, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
  // Shopee credentials
  const [appId, setAppId] = useState("");
  const [secret, setSecret] = useState("");
  const [credConfigured, setCredConfigured] = useState(false);
  const [credAppId, setCredAppId] = useState<string | null>(null);
  const [credUpdated, setCredUpdated] = useState<string | null>(null);
  const [savingCred, setSavingCred] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "ok" | "fail">("idle");

  // AI key
  const [aiKey, setAiKey] = useState("");
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiSource, setAiSource] = useState<"env" | "db" | "none">("none");
  const [savingAi, setSavingAi] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const loadSettings = useCallback(async (): Promise<void> => {
    try {
      const [credRes, aiRes] = await Promise.all([
        fetch("/api/settings/credentials"),
        fetch("/api/settings/ai-key"),
      ]);
      const credData = await credRes.json();
      const aiData = await aiRes.json();

      setCredConfigured(credData.configured);
      setCredAppId(credData.appId);
      setCredUpdated(credData.updatedAt);

      setAiConfigured(aiData.configured);
      setAiSource(aiData.source);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function saveCredentials(): Promise<void> {
    if (!appId || !secret) {
      toast.error("AppId dan Secret wajib diisi");
      return;
    }
    setSavingCred(true);
    try {
      const res = await fetch("/api/settings/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, secret }),
      });
      if (!res.ok) {
        toast.error("Gagal menyimpan credentials");
        return;
      }
      toast.success("Shopee credentials disimpan!");
      setAppId("");
      setSecret("");
      void loadSettings();
    } catch {
      toast.error("Koneksi gagal");
    } finally {
      setSavingCred(false);
    }
  }

  async function testConnection(): Promise<void> {
    setTesting(true);
    setTestResult("idle");
    try {
      const res = await fetch("/api/shopee/test");
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        setTestResult("ok");
        toast.success("Koneksi berhasil!");
      } else {
        setTestResult("fail");
        toast.error(data.error ?? "Koneksi gagal");
      }
    } catch {
      setTestResult("fail");
      toast.error("Koneksi gagal");
    } finally {
      setTesting(false);
    }
  }

  async function saveAiKey(): Promise<void> {
    if (!aiKey) {
      toast.error("API key wajib diisi");
      return;
    }
    setSavingAi(true);
    try {
      const res = await fetch("/api/settings/ai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: aiKey }),
      });
      if (!res.ok) {
        toast.error("Gagal menyimpan AI key");
        return;
      }
      toast.success("AI API key disimpan!");
      setAiKey("");
      void loadSettings();
    } catch {
      toast.error("Koneksi gagal");
    } finally {
      setSavingAi(false);
    }
  }

  async function deleteAiKey(): Promise<void> {
    try {
      await fetch("/api/settings/ai-key", { method: "DELETE" });
      toast.success("AI key dihapus");
      void loadSettings();
    } catch {
      toast.error("Gagal hapus AI key");
    }
  }

  async function changePassword(): Promise<void> {
    if (!currentPassword || !newPassword) {
      toast.error("Isi semua field");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "INVALID_CURRENT_PASSWORD") {
          toast.error("Password saat ini salah");
        } else {
          toast.error("Gagal ganti password");
        }
        return;
      }
      toast.success("Password berhasil diganti!");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Koneksi gagal");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Konfigurasi API credentials & account</p>
      </div>

      {/* Shopee API Credentials */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">Shopee Affiliate API</CardTitle>
              <CardDescription>App ID & Secret dari Shopee Open API</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {credConfigured && (
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Configured: {credAppId}</p>
                {credUpdated && (
                  <p className="text-xs text-muted-foreground">Updated: {formatDate(credUpdated, true)}</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={testConnection} disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Connection"}
              </Button>
            </div>
          )}

          {testResult === "ok" && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Koneksi berhasil!
            </div>
          )}
          {testResult === "fail" && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4" /> Koneksi gagal. Cek App ID & Secret.
            </div>
          )}

          <div className="space-y-2">
            <Label>App ID</Label>
            <Input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="Shopee Affiliate App ID" />
          </div>
          <div className="space-y-2">
            <Label>Secret</Label>
            <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Shopee Affiliate Secret" />
          </div>
          <Button onClick={saveCredentials} disabled={savingCred}>
            {savingCred ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {credConfigured ? "Update Credentials" : "Save Credentials"}
          </Button>

          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium">Cara mendapatkan credentials:</p>
            <ol className="mt-1 list-decimal pl-4 space-y-1">
              <li>Buka <span className="font-medium">affiliate.shopee.co.id/open_api</span></li>
              <li>Help Center → request API access</li>
              <li>Tunggu approval (hingga 2 minggu)</li>
              <li>Setelah approved, dapat App ID & Secret</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">AI Caption Enhancement</CardTitle>
              <CardDescription>OpenAI API key untuk AI caption (opsional)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiConfigured && (
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">AI Enhancement Aktif</p>
                <p className="text-xs text-muted-foreground">
                  Source: {aiSource === "env" ? "Environment variable" : "Database"}
                </p>
              </div>
              {aiSource === "db" && (
                <Button variant="ghost" size="sm" onClick={deleteAiKey}>
                  <Trash2 className="h-3 w-3" /> Hapus
                </Button>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>OpenAI API Key</Label>
            <Input type="password" value={aiKey} onChange={(e) => setAiKey(e.target.value)} placeholder="sk-..." />
          </div>
          <Button onClick={saveAiKey} disabled={savingAi}>
            {savingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save AI Key
          </Button>

          {!aiConfigured && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">Optional</Badge>
              Tanpa AI key, caption generator tetap berfungsi dengan template-based mode.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription>Update password akun Anda</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password Saat Ini</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Password Baru (min 8 karakter)</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <Button onClick={changePassword} disabled={savingPassword}>
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ganti Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
