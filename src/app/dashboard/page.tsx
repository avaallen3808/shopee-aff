import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Link2, PenTool, BarChart3, TrendingUp, Zap, Target } from "lucide-react";

const QUICK_ACTIONS = [
  { href: "/dashboard/discover", title: "Cari Produk", description: "Discover produk dengan komisi tertinggi", icon: Search },
  { href: "/dashboard/links", title: "Buat Link", description: "Generate short link dengan campaign tracking", icon: Link2 },
  { href: "/dashboard/content", title: "Content Studio", description: "Caption + image card generator", icon: PenTool },
  { href: "/dashboard/analytics", title: "Analytics", description: "Lihat performa & channel attribution", icon: BarChart3 },
] as const;

const META_TIPS = [
  { icon: Zap, title: "Indirect Orders", description: "Klik link -> beli produk apapun dalam 7 hari tetap komisi. Fokus volume klik." },
  { icon: TrendingUp, title: "Three High Products", description: "Pilih produk high-commission, high-popularity (sales >1000), high-profit." },
  { icon: Target, title: "Multi-Channel Attribution", description: "subIds per channel untuk track channel mana paling menguntungkan." },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Maximalkan pendapatan Shopee Affiliate dengan META strategy
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">META Strategy Tips</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {META_TIPS.map((tip) => {
            const Icon = tip.icon;
            return (
              <Card key={tip.title}>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <Icon className="h-5 w-5 text-shopee" />
                  </div>
                  <CardTitle className="text-base">{tip.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {tip.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
