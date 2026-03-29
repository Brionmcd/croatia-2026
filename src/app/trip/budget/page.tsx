"use client";

import { useEffect, useState, useMemo } from "react";
import { Wallet, ArrowLeftRight, Users, Building2, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { getTripByAccessCode, getBudgetItems } from "@/lib/api";
import type { BudgetItem } from "@/types/database";

const EUR_TO_USD = 1.08;
const NUM_FAMILIES = 4;
const ACCESS_CODE_KEY = "croatia2026_access_code";

const CATEGORY_LABELS: Record<string, string> = {
  transfer: "Transfers",
  activity: "Activities",
  meal_estimate: "Meals",
  entrance_fee: "Entrance Fees",
  tip: "Tips",
  other: "Other",
};

const CATEGORY_ORDER = [
  "transfer",
  "activity",
  "entrance_fee",
  "meal_estimate",
  "tip",
  "other",
];

const PAID_TO_LABELS: Record<string, string> = {
  villa_escape: "Villa Escape",
  on_site: "On-site",
  self: "Self",
};

export default function BudgetPage() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUsd, setShowUsd] = useState(false);

  useEffect(() => {
    async function load() {
      const code = localStorage.getItem(ACCESS_CODE_KEY);
      if (!code) return;
      const trip = await getTripByAccessCode(code);
      if (!trip) return;
      const budgetItems = await getBudgetItems(trip.id);
      setItems(budgetItems);
      setLoading(false);
    }
    load();
  }, []);

  const convert = (eur: number) => (showUsd ? eur * EUR_TO_USD : eur);
  const symbol = showUsd ? "$" : "\u20AC";
  const fmt = (eur: number) =>
    `${symbol}${convert(eur).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const totalConfirmed = useMemo(
    () => items.filter((i) => i.is_confirmed).reduce((s, i) => s + i.amount_eur, 0),
    [items]
  );
  const totalEstimated = useMemo(
    () => items.reduce((s, i) => s + i.amount_eur, 0),
    [items]
  );
  const progressPct = totalEstimated > 0 ? (totalConfirmed / totalEstimated) * 100 : 0;

  const grouped = useMemo(() => {
    const map: Record<string, BudgetItem[]> = {};
    for (const item of items) {
      const cat = item.category;
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    return map;
  }, [items]);

  const paidToVilla = useMemo(
    () => items.filter((i) => i.paid_to === "villa_escape").reduce((s, i) => s + i.amount_eur, 0),
    [items]
  );
  const paidOnSite = useMemo(
    () => items.filter((i) => i.paid_to === "on_site").reduce((s, i) => s + i.amount_eur, 0),
    [items]
  );
  const paidSelf = useMemo(
    () => items.filter((i) => i.paid_to === "self").reduce((s, i) => s + i.amount_eur, 0),
    [items]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Wallet className="h-12 w-12 text-primary/30 mb-4 animate-pulse" />
        <p className="text-muted-foreground">Loading budget...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Wallet className="h-12 w-12 text-primary/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Budget</h1>
        <p className="mt-2 text-muted-foreground">No budget items yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with currency toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Budget</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUsd((v) => !v)}
          className="gap-1.5"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {showUsd ? "USD" : "EUR"}
        </Button>
      </div>

      {showUsd && (
        <p className="text-xs text-muted-foreground -mt-4">
          Using rate: 1 EUR = {EUR_TO_USD} USD
        </p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{fmt(totalConfirmed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total (incl. estimated)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(totalEstimated)}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Per Family ({NUM_FAMILIES}-way split)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {fmt(totalEstimated / NUM_FAMILIES)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmt(totalConfirmed / NUM_FAMILIES)} confirmed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Confirmed vs Total</span>
            <span className="font-medium">{Math.round(progressPct)}% confirmed</span>
          </div>
          <Progress value={progressPct} className="h-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5">
            <span>{fmt(totalConfirmed)} confirmed</span>
            <span>{fmt(totalEstimated)} total</span>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <div className="space-y-4">
        {CATEGORY_ORDER.filter((cat) => grouped[cat]).map((cat) => {
          const catItems = grouped[cat];
          const catTotal = catItems.reduce((s, i) => s + i.amount_eur, 0);
          return (
            <Card key={cat}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {CATEGORY_LABELS[cat] || cat}
                  </CardTitle>
                  <span className="text-sm font-semibold">{fmt(catTotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {fmt(catTotal / NUM_FAMILIES)} per family
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-border">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between py-3 gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <Badge
                            variant={item.is_confirmed ? "default" : "secondary"}
                            className={
                              item.is_confirmed
                                ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"
                            }
                          >
                            {item.is_confirmed ? "Confirmed" : "Estimated"}
                          </Badge>
                          {item.paid_to && (
                            <Badge variant="outline" className="text-xs">
                              {PAID_TO_LABELS[item.paid_to] || item.paid_to}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">{fmt(item.amount_eur)}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmt(item.amount_eur / NUM_FAMILIES)}/fam
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment breakdown */}
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Paid to Villa Escape</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">{fmt(paidToVilla)}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({fmt(paidToVilla / NUM_FAMILIES)}/fam)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Paid on-site</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">{fmt(paidOnSite)}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({fmt(paidOnSite / NUM_FAMILIES)}/fam)
              </span>
            </div>
          </div>
          {paidSelf > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Self-pay</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold">{fmt(paidSelf)}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({fmt(paidSelf / NUM_FAMILIES)}/fam)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
