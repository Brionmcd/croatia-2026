"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Euro,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  Plane,
  CalendarDays,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getTripByAccessCode, getDays, getActivities, getFamilies } from "@/lib/api";
import type { Trip, Day, Activity, Family } from "@/types/database";

const ACCESS_CODE_KEY = "croatia2026_access_code";
const TRIP_START = new Date("2026-07-18T00:00:00");
const NUM_FAMILIES = 4;

// --- Weather types & helpers ---

interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  code: number;
}

function weatherIcon(code: number) {
  if (code === 0) return <Sun className="h-5 w-5 text-amber-500" />;
  if (code >= 1 && code <= 3) return <Cloud className="h-5 w-5 text-slate-400" />;
  if (code >= 45 && code <= 48) return <CloudFog className="h-5 w-5 text-slate-400" />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className="h-5 w-5 text-blue-400" />;
  if (code >= 61 && code <= 67) return <CloudRain className="h-5 w-5 text-blue-500" />;
  if (code >= 71 && code <= 77) return <CloudSnow className="h-5 w-5 text-blue-200" />;
  if (code >= 80 && code <= 82) return <CloudRain className="h-5 w-5 text-blue-500" />;
  if (code >= 95 && code <= 99) return <CloudLightning className="h-5 w-5 text-yellow-600" />;
  return <Sun className="h-5 w-5 text-amber-500" />;
}

function weatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code >= 1 && code <= 3) return "Partly cloudy";
  if (code >= 45 && code <= 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "Clear";
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string, dayOfWeek: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const day = d.getDate();
  return `${dayOfWeek}, ${month} ${day}`;
}

function formatTime(time: string): string {
  // time may be "HH:MM" or "HH:MM:SS"
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

const statusConfig: Record<
  Activity["status"],
  { emoji: string; label: string; className: string }
> = {
  confirmed: { emoji: "\u2705", label: "Confirmed", className: "bg-emerald-100 text-emerald-800" },
  pending_vote: { emoji: "\uD83D\uDDF3\uFE0F", label: "Pending Vote", className: "bg-blue-100 text-blue-800" },
  tentative: { emoji: "\u26A0\uFE0F", label: "Tentative", className: "bg-amber-100 text-amber-800" },
  cancelled: { emoji: "\u274C", label: "Cancelled", className: "bg-red-100 text-red-800" },
};

// --- Data types ---

interface DayWithActivities extends Day {
  activities: Activity[];
}

// --- Component ---

export default function ItineraryPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<DayWithActivities[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [weather, setWeather] = useState<{ split: WeatherDay[]; dubrovnik: WeatherDay[] }>({
    split: [],
    dubrovnik: [],
  });

  const toggleActivity = useCallback((id: string) => {
    setExpandedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Fetch trip data
  useEffect(() => {
    async function load() {
      try {
        const code = localStorage.getItem(ACCESS_CODE_KEY);
        if (!code) {
          router.replace("/");
          return;
        }

        const tripData = await getTripByAccessCode(code);
        if (!tripData) {
          // Invalid code — clear it and send back to entry screen
          localStorage.removeItem(ACCESS_CODE_KEY);
          router.replace("/");
          return;
        }
        setTrip(tripData);

        const [daysData, familiesData] = await Promise.all([
          getDays(tripData.id),
          getFamilies(tripData.id),
        ]);
        setFamilies(familiesData);

        // Fetch activities for all days in parallel
        const daysWithActivities = await Promise.all(
          daysData.map(async (day) => {
            const activities = await getActivities(day.id);
            return { ...day, activities };
          })
        );
        setDays(daysWithActivities);
      } catch (err) {
        console.error("Error loading itinerary:", err);
        setError("Failed to load itinerary. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Fetch weather
  useEffect(() => {
    async function fetchWeather() {
      try {
        const [splitRes, dubRes] = await Promise.all([
          fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=43.5081&longitude=16.4402&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe/Zagreb&forecast_days=7"
          ),
          fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=42.6507&longitude=18.0944&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe/Zagreb&forecast_days=7"
          ),
        ]);

        if (splitRes.ok && dubRes.ok) {
          const splitData = await splitRes.json();
          const dubData = await dubRes.json();

          const parse = (data: {
            daily: {
              time: string[];
              temperature_2m_max: number[];
              temperature_2m_min: number[];
              weathercode: number[];
            };
          }): WeatherDay[] =>
            data.daily.time.map((date: string, i: number) => ({
              date,
              tempMax: Math.round(data.daily.temperature_2m_max[i]),
              tempMin: Math.round(data.daily.temperature_2m_min[i]),
              code: data.daily.weathercode[i],
            }));

          setWeather({ split: parse(splitData), dubrovnik: parse(dubData) });
        }
      } catch {
        // Weather is non-critical, fail silently
      }
    }

    fetchWeather();
  }, []);

  // Countdown
  const now = new Date();
  const diffMs = TRIP_START.getTime() - now.getTime();
  const daysUntilTrip = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isTripTime = diffMs <= 0;

  // Determine "today" for highlighting
  const todayStr = now.toISOString().split("T")[0];

  // Find the current or next day index
  const currentDayIndex = days.findIndex((d) => d.date >= todayStr);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive/50 mb-4" />
        <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Countdown hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -right-2 top-8 h-16 w-16 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium">
            <Plane className="h-4 w-4" />
            <span>{trip?.name ?? "Croatia 2026"}</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {isTripTime ? "Trip time!" : `${daysUntilTrip} days until Croatia!`}
          </h1>
          <p className="mt-1 text-primary-foreground/70 text-sm">
            {trip
              ? `${new Date(trip.start_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${new Date(trip.end_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
              : ""}
            {families.length > 0 && ` \u00B7 ${families.length} families`}
          </p>
        </div>
      </div>

      {/* Weather strip */}
      {weather.split.length > 0 && (
        <WeatherStrip split={weather.split} dubrovnik={weather.dubrovnik} />
      )}

      {/* Day-by-day timeline */}
      <div className="space-y-4">
        {days.map((day, dayIdx) => {
          const isHighlighted = dayIdx === currentDayIndex;
          const isPast = day.date < todayStr;
          const locationColor =
            day.location?.toLowerCase() === "dubrovnik"
              ? "bg-accent text-accent-foreground"
              : "bg-primary text-primary-foreground";

          return (
            <div key={day.id} className="relative">
              {/* Sticky day header */}
              <div
                className={`sticky top-12 md:top-14 z-30 -mx-4 px-4 py-3 backdrop-blur-md transition-colors ${
                  isHighlighted
                    ? "bg-primary/5 border-b border-primary/20"
                    : "bg-background/90 border-b border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${
                        isHighlighted
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                          : isPast
                            ? "bg-muted text-muted-foreground"
                            : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {day.day_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            isHighlighted ? "text-primary" : isPast ? "text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {formatDate(day.date, day.day_of_week)}
                        </span>
                        {isHighlighted && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            TODAY
                          </span>
                        )}
                      </div>
                      {day.title && (
                        <p className="text-xs text-muted-foreground mt-0.5">{day.title}</p>
                      )}
                    </div>
                  </div>
                  {day.location && (
                    <Badge className={`${locationColor} text-[10px] font-semibold uppercase tracking-wider`}>
                      <MapPin className="h-3 w-3" />
                      {day.location}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Activities */}
              <div className={`mt-3 space-y-3 ${isPast ? "opacity-60" : ""}`}>
                {day.activities.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                    <CalendarDays className="h-4 w-4 mr-2 opacity-50" />
                    No activities planned yet
                  </div>
                ) : (
                  day.activities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      expanded={expandedActivities.has(activity.id)}
                      onToggle={() => toggleActivity(activity.id)}
                      familyCount={families.length || NUM_FAMILIES}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {days.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="h-12 w-12 text-primary/20 mb-4" />
          <h2 className="text-lg font-semibold text-foreground">No days planned yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The itinerary will appear here once days are added.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Activity Card ---

function ActivityCard({
  activity,
  expanded,
  onToggle,
  familyCount,
}: {
  activity: Activity;
  expanded: boolean;
  onToggle: () => void;
  familyCount: number;
}) {
  const status = statusConfig[activity.status];
  const hasCost = activity.total_cost_eur != null && activity.total_cost_eur > 0;
  const perFamily = hasCost ? activity.total_cost_eur! / familyCount : 0;
  const hasDetails = activity.details && activity.details.trim().length > 0;
  const hasRestrictions = activity.restrictions && activity.restrictions.trim().length > 0;
  const hasWarnings = activity.warning_flags && activity.warning_flags.length > 0;
  const isCancelled = activity.status === "cancelled";

  return (
    <Card
      size="sm"
      className={`transition-all ${isCancelled ? "opacity-50" : ""} ${
        hasDetails ? "cursor-pointer" : ""
      }`}
      onClick={hasDetails ? onToggle : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {activity.time && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                  <Clock className="h-3 w-3" />
                  {formatTime(activity.time)}
                </span>
              )}
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${status.className}`}>
                {status.emoji} {status.label}
              </span>
            </div>
            <CardTitle className="mt-1.5">
              <span className={isCancelled ? "line-through" : ""}>{activity.title}</span>
            </CardTitle>
            {activity.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {activity.description}
              </p>
            )}
          </div>

          {/* Cost column */}
          {hasCost && (
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                {formatEur(activity.total_cost_eur!).replace("EUR", "").trim()}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {formatEur(perFamily)}/family
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Badges row */}
      {(hasRestrictions || hasWarnings) && (
        <CardContent className="pt-0 -mt-2">
          <div className="flex flex-wrap gap-1.5">
            {hasRestrictions && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                {activity.restrictions}
              </span>
            )}
            {hasWarnings &&
              activity.warning_flags.map((flag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-medium text-red-700"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {flag}
                </span>
              ))}
          </div>
        </CardContent>
      )}

      {/* Expand toggle */}
      {hasDetails && (
        <CardContent className="pt-0 -mt-2">
          <div className="flex items-center gap-1 text-xs text-primary font-medium">
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Show details
              </>
            )}
          </div>
        </CardContent>
      )}

      {/* Expanded details */}
      {expanded && hasDetails && (
        <CardContent className="pt-0">
          <div className="rounded-lg bg-secondary/50 p-3 text-xs text-secondary-foreground leading-relaxed whitespace-pre-wrap">
            {activity.details}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// --- Weather Strip ---

function WeatherStrip({
  split,
  dubrovnik,
}: {
  split: WeatherDay[];
  dubrovnik: WeatherDay[];
}) {
  const [showCity, setShowCity] = useState<"split" | "dubrovnik">("split");
  const data = showCity === "split" ? split : dubrovnik;

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sun className="h-4 w-4 text-amber-500" />
            7-Day Forecast
          </CardTitle>
          <div className="flex gap-1">
            <button
              onClick={() => setShowCity("split")}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                showCity === "split"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setShowCity("dubrovnik")}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                showCity === "dubrovnik"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Dubrovnik
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {data.map((w) => {
            const d = new Date(w.date + "T00:00:00");
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = d.getDate();
            return (
              <div
                key={w.date}
                className="flex flex-col items-center gap-1 rounded-xl bg-secondary/50 px-3 py-2.5 min-w-[60px]"
              >
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  {dayName}
                </span>
                <span className="text-xs font-medium text-foreground">{dayNum}</span>
                <div title={weatherLabel(w.code)}>{weatherIcon(w.code)}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-foreground">{w.tempMax}°</span>
                  <span className="text-[10px] text-muted-foreground">{w.tempMin}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Loading Skeleton ---

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-2xl bg-primary/10 h-36" />

      {/* Weather skeleton */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-4">
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 w-[60px] bg-muted rounded-xl shrink-0" />
          ))}
        </div>
      </div>

      {/* Day skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center gap-3 py-3">
            <div className="h-10 w-10 bg-muted rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
          <div className="space-y-3 mt-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <div
                key={j}
                className="rounded-xl bg-card ring-1 ring-foreground/10 p-4 space-y-2"
              >
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-3 w-64 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
