"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import {
  Plane,
  Luggage,
  Shield,
  Utensils,
  Info,
  Check,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { getTripByAccessCode } from "@/lib/api";
import { getFamilies, getPackingItems, getDays, getRestaurantReservations } from "@/lib/api";
import type { Trip, Family, PackingItem, Day, RestaurantReservation } from "@/types/database";

const ACCESS_CODE_KEY = "croatia2026_access_code";

// -- Arrivals & Departures Section --

function ArrivalsSection({ families }: { families: Family[] }) {
  const familiesWithArrival = families
    .filter((f) => f.arrival_datetime)
    .sort(
      (a, b) =>
        new Date(a.arrival_datetime!).getTime() -
        new Date(b.arrival_datetime!).getTime()
    );

  const familiesWithDeparture = families
    .filter((f) => f.departure_datetime)
    .sort(
      (a, b) =>
        new Date(a.departure_datetime!).getTime() -
        new Date(b.departure_datetime!).getTime()
    );

  function formatDatetime(dt: string) {
    const d = new Date(dt);
    return d.toLocaleDateString("en-IE", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) +
      " at " +
      d.toLocaleTimeString("en-IE", {
        hour: "2-digit",
        minute: "2-digit",
      });
  }

  // Visual timeline: simple horizontal bar showing arrival times
  const allArrivals = familiesWithArrival.map((f) => ({
    name: f.name,
    time: new Date(f.arrival_datetime!).getTime(),
    airport: f.arrival_airport,
  }));

  let minTime = 0;
  let maxTime = 1;
  if (allArrivals.length > 1) {
    minTime = Math.min(...allArrivals.map((a) => a.time));
    maxTime = Math.max(...allArrivals.map((a) => a.time));
  } else if (allArrivals.length === 1) {
    minTime = allArrivals[0].time - 3600000;
    maxTime = allArrivals[0].time + 3600000;
  }
  const range = maxTime - minTime || 1;

  return (
    <div className="space-y-6">
      {/* Arrival Timeline */}
      {allArrivals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Arrival Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative py-4">
              <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
              {allArrivals.map((arrival, i) => {
                const pct =
                  allArrivals.length === 1
                    ? 50
                    : ((arrival.time - minTime) / range) * 80 + 10;
                return (
                  <div
                    key={arrival.name}
                    className="absolute flex flex-col items-center"
                    style={{
                      left: `${pct}%`,
                      top: i % 2 === 0 ? "-8px" : "20px",
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
                    <span className="mt-1 text-xs font-medium whitespace-nowrap">
                      {arrival.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {arrival.airport ?? ""}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Staggered arrival note */}
            <div className="mt-8 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-400">
                  Staggered Arrivals
                </p>
                <p className="text-amber-700 dark:text-amber-500">
                  Some families arrive via Split (longer transfer ~1h40m), others
                  via Zadar. Check each family&apos;s details below for transfer info.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Arrivals */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Arrivals
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {familiesWithArrival.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2">
              No arrival info available yet.
            </p>
          )}
          {familiesWithArrival.map((fam) => (
            <Card key={fam.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{fam.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {fam.adults} adults
                      {fam.children > 0 &&
                        `, ${fam.children} child${fam.children > 1 ? "ren" : ""}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    <Plane className="mr-1 h-3 w-3" />
                    {fam.arrival_flight ?? "TBD"}
                  </Badge>
                </div>
                <Separator className="my-3" />
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{fam.arrival_airport ?? "Airport TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatDatetime(fam.arrival_datetime!)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Departures */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Departures
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {familiesWithDeparture.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2">
              No departure info available yet.
            </p>
          )}
          {familiesWithDeparture.map((fam) => (
            <Card key={fam.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{fam.name}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    <Plane className="mr-1 h-3 w-3" />
                    {fam.departure_flight ?? "TBD"}
                  </Badge>
                </div>
                <Separator className="my-3" />
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatDatetime(fam.departure_datetime!)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// -- Packing Checklist Section --

const CATEGORY_LABELS: Record<string, string> = {
  essential: "Essential",
  activity_specific: "Activity-Specific",
  comfort: "Comfort",
  documents: "Documents",
};

const CATEGORY_ORDER = ["essential", "documents", "activity_specific", "comfort"];

function PackingSection({
  packingItems,
  families,
}: {
  packingItems: PackingItem[];
  families: Family[];
}) {
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Pick first family by default
  useEffect(() => {
    if (families.length > 0 && !selectedFamily) {
      setSelectedFamily(families[0].id);
    }
  }, [families, selectedFamily]);

  // Load checked state from localStorage when family changes
  useEffect(() => {
    if (!selectedFamily) return;
    const loaded: Record<string, boolean> = {};
    for (const item of packingItems) {
      const key = `croatia2026_packed_${selectedFamily}_${item.id}`;
      loaded[item.id] = localStorage.getItem(key) === "true";
    }
    setCheckedItems(loaded);
  }, [selectedFamily, packingItems]);

  function toggleItem(itemId: string) {
    if (!selectedFamily) return;
    const key = `croatia2026_packed_${selectedFamily}_${itemId}`;
    const newVal = !checkedItems[itemId];
    localStorage.setItem(key, String(newVal));
    setCheckedItems((prev) => ({ ...prev, [itemId]: newVal }));
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    items: packingItems.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  const totalItems = packingItems.length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Family selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Packing for:
        </span>
        {families.map((fam) => (
          <Button
            key={fam.id}
            variant={selectedFamily === fam.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFamily(fam.id)}
          >
            {fam.name}
          </Button>
        ))}
      </div>

      {/* Progress */}
      <Progress value={progressPct}>
        <ProgressLabel>Packed</ProgressLabel>
        <ProgressValue>
          {() => `${checkedCount} / ${totalItems}`}
        </ProgressValue>
      </Progress>

      {/* Items by category */}
      {grouped.map((group) => (
        <Card key={group.category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{group.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {group.items.map((item) => {
                const isChecked = !!checkedItems[item.id];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/50"
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                          isChecked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-sm font-medium ${
                            isChecked
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {item.item}
                        </span>
                        {item.for_activity && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (for {item.for_activity})
                          </span>
                        )}
                        {item.notes && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}

      {packingItems.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No packing items added yet.
        </p>
      )}
    </div>
  );
}

// -- Emergency Info Section --

const EMERGENCY_NUMBERS = [
  { label: "General Emergency", number: "112" },
  { label: "Police", number: "192" },
  { label: "Ambulance", number: "194" },
  { label: "Fire", number: "193" },
];

const HOSPITALS = [
  {
    city: "Split",
    name: "KBC Split",
    address: "Spinčićeva 1",
    phone: "021-556-111",
  },
  {
    city: "Dubrovnik",
    name: "Opća bolnica Dubrovnik",
    address: "Dr. Roka Mišetića 2",
    phone: "020-431-777",
  },
];

const EMBASSIES = [
  {
    country: "Ireland",
    location: "Rome (nearest)",
    phone: "+39 06 585 2381",
  },
  {
    country: "India",
    location: "Zagreb",
    phone: "+385 1 4873 239",
  },
  {
    country: "United States",
    location: "Zagreb",
    phone: "+385 1 661 2200",
  },
];

function EmergencySection({ families }: { families: Family[] }) {
  const [insuranceNotes, setInsuranceNotes] = useState<Record<string, string>>(
    {}
  );

  // Load insurance notes from localStorage
  useEffect(() => {
    const loaded: Record<string, string> = {};
    for (const fam of families) {
      const key = `croatia2026_insurance_${fam.id}`;
      const val = localStorage.getItem(key);
      if (val) loaded[fam.id] = val;
    }
    setInsuranceNotes(loaded);
  }, [families]);

  function saveInsuranceNote(familyId: string, note: string) {
    const key = `croatia2026_insurance_${familyId}`;
    localStorage.setItem(key, note);
    setInsuranceNotes((prev) => ({ ...prev, [familyId]: note }));
  }

  return (
    <div className="space-y-6">
      {/* Emergency Numbers */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
            <Phone className="h-4 w-4" />
            Emergency Numbers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EMERGENCY_NUMBERS.map((e) => (
              <a
                key={e.number}
                href={`tel:${e.number}`}
                className="flex flex-col items-center rounded-lg border border-red-100 bg-red-50 p-3 text-center transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:hover:bg-red-950/50"
              >
                <span className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {e.number}
                </span>
                <span className="mt-1 text-xs font-medium text-red-600 dark:text-red-500">
                  {e.label}
                </span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nearest Hospitals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Nearest Hospitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {HOSPITALS.map((h) => (
              <div
                key={h.city}
                className="rounded-lg border p-3 space-y-1"
              >
                <p className="font-semibold">{h.name}</p>
                <p className="text-sm text-muted-foreground">{h.city}</p>
                <p className="text-sm">{h.address}</p>
                <a
                  href={`tel:${h.phone}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {h.phone}
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Embassies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            Embassies &amp; Consulates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {EMBASSIES.map((e) => (
              <div
                key={e.country}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{e.country}</p>
                  <p className="text-sm text-muted-foreground">{e.location}</p>
                </div>
                <a
                  href={`tel:${e.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {e.phone}
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Travel Insurance Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Travel Insurance Info</CardTitle>
          <p className="text-sm text-muted-foreground">
            Save your policy details for quick reference. Stored locally on this
            device.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {families.map((fam) => (
              <div key={fam.id} className="space-y-2">
                <label className="text-sm font-medium">{fam.name}</label>
                <Input
                  placeholder="e.g. Allianz #POL-12345, 1-800-..."
                  value={insuranceNotes[fam.id] ?? ""}
                  onChange={(e) =>
                    saveInsuranceNote(fam.id, (e.target as HTMLInputElement).value)
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// -- Restaurant Reservations Section --

function statusBadgeVariant(
  status: "pending" | "confirmed" | "cancelled"
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "confirmed":
      return "default";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function RestaurantsSection({
  reservations,
  days,
  families,
}: {
  reservations: RestaurantReservation[];
  days: Day[];
  families: Family[];
}) {
  const familyMap = Object.fromEntries(families.map((f) => [f.id, f.name]));
  const dayMap = Object.fromEntries(
    days.map((d) => [
      d.id,
      {
        label: `Day ${d.day_number} - ${d.day_of_week}`,
        date: d.date,
        dayNumber: d.day_number,
      },
    ])
  );

  // Group by day
  const byDay = new Map<string, RestaurantReservation[]>();
  for (const r of reservations) {
    const key = r.day_id ?? "__unassigned";
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(r);
  }

  // Sort day keys by day number
  const sortedKeys = Array.from(byDay.keys()).sort((a, b) => {
    const da = a === "__unassigned" ? 999 : (dayMap[a]?.dayNumber ?? 999);
    const db = b === "__unassigned" ? 999 : (dayMap[b]?.dayNumber ?? 999);
    return da - db;
  });

  function formatTime(timeStr: string) {
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-IE", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeStr;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-amber-700 dark:text-amber-500">
          <span className="font-medium">16 people in peak July</span> — advance
          reservations are essential. Book popular spots at least 2 weeks ahead.
        </p>
      </div>

      {sortedKeys.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No restaurant reservations yet.
        </p>
      )}

      {sortedKeys.map((dayKey) => {
        const dayInfo = dayMap[dayKey];
        const dayReservations = byDay.get(dayKey)!;
        return (
          <div key={dayKey}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {dayInfo
                ? `${dayInfo.label} (${new Date(dayInfo.date).toLocaleDateString("en-IE", { month: "short", day: "numeric" })})`
                : "Unassigned Day"}
            </h3>
            <div className="space-y-2">
              {dayReservations.map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-semibold">{r.restaurant_name}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(r.time)}
                          </span>
                          <span>{r.num_people} people</span>
                          {r.booked_by_family_id && (
                            <span>
                              Booked by:{" "}
                              {familyMap[r.booked_by_family_id] ?? "Unknown"}
                            </span>
                          )}
                        </div>
                        {r.notes && (
                          <p className="text-xs text-muted-foreground">
                            {r.notes}
                          </p>
                        )}
                      </div>
                      <Badge variant={statusBadgeVariant(r.confirmation_status)}>
                        {statusLabel(r.confirmation_status)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -- Useful Info Section --

const USEFUL_INFO = [
  {
    label: "Currency",
    value: "Euro (EUR)",
    detail: "Croatia adopted the Euro in January 2023, replacing the Kuna.",
  },
  {
    label: "Time Zone",
    value: "CEST (UTC+2)",
    detail: "Central European Summer Time during July.",
  },
  {
    label: "Language",
    value: "Croatian",
    detail: "Most people in tourist areas speak English.",
  },
  {
    label: "Tipping",
    value: "10-15% in restaurants",
    detail: "Not mandatory but appreciated for good service.",
  },
  {
    label: "Tap Water",
    value: "Safe to drink",
    detail: "Tap water is safe throughout Croatia.",
  },
  {
    label: "Power",
    value: "EU Type C/F plugs, 230V",
    detail:
      "Bring EU adapters if traveling from US/UK/India. Most phone chargers are dual-voltage.",
  },
];

function UsefulInfoSection() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {USEFUL_INFO.map((info) => (
        <Card key={info.label}>
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-muted-foreground">
              {info.label}
            </p>
            <p className="text-lg font-semibold">{info.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{info.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// -- Main Page --

export default function LogisticsPage() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [reservations, setReservations] = useState<RestaurantReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const code = localStorage.getItem(ACCESS_CODE_KEY);
      if (!code) {
        setError("No access code found. Please go back and enter your code.");
        setLoading(false);
        return;
      }

      const tripData = await getTripByAccessCode(code);
      if (!tripData) {
        setError("Trip not found. Please check your access code.");
        setLoading(false);
        return;
      }

      setTrip(tripData);

      const [fams, items, tripDays, resos] = await Promise.all([
        getFamilies(tripData.id),
        getPackingItems(tripData.id),
        getDays(tripData.id),
        getRestaurantReservations(tripData.id),
      ]);

      setFamilies(fams);
      setPackingItems(items);
      setDays(tripDays);
      setReservations(resos);
    } catch (err) {
      console.error("Error loading logistics data:", err);
      setError("Something went wrong loading the data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Loading logistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-destructive/50 mb-4" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const TAB_SECTIONS = [
    {
      value: "arrivals",
      label: "Arrivals",
      icon: <Plane className="h-4 w-4" />,
    },
    {
      value: "packing",
      label: "Packing",
      icon: <Luggage className="h-4 w-4" />,
    },
    {
      value: "emergency",
      label: "Emergency",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      value: "restaurants",
      label: "Dining",
      icon: <Utensils className="h-4 w-4" />,
    },
    {
      value: "info",
      label: "Info",
      icon: <Info className="h-4 w-4" />,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Logistics &amp; Info Hub
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need for {trip?.name ?? "the trip"} in one place.
        </p>
      </div>

      <Tabs defaultValue="arrivals">
        <TabsList className="mb-4 w-full flex-wrap">
          {TAB_SECTIONS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              <span className="hidden sm:inline-flex items-center gap-1.5">
                {tab.icon}
                {tab.label}
              </span>
              <span className="sm:hidden inline-flex items-center gap-1">
                {tab.icon}
                <span className="text-xs">{tab.label}</span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="arrivals">
          <ArrivalsSection families={families} />
        </TabsContent>

        <TabsContent value="packing">
          <PackingSection packingItems={packingItems} families={families} />
        </TabsContent>

        <TabsContent value="emergency">
          <EmergencySection families={families} />
        </TabsContent>

        <TabsContent value="restaurants">
          <RestaurantsSection
            reservations={reservations}
            days={days}
            families={families}
          />
        </TabsContent>

        <TabsContent value="info">
          <UsefulInfoSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
