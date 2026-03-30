"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  Plane,
  CalendarDays,
  Vote,
  MessageCircleQuestion,
  ArrowLeftRight,
  CircleAlert,
  CircleDot,
  CircleCheck,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/lib/currency";
import { useFamily } from "@/lib/family-context";
import {
  getTripByAccessCode,
  getDays,
  getActivities,
  getDecisions,
  getDecisionOptions,
  getVotes,
  getQuestions,
  getPackingItems,
} from "@/lib/api";
import type { Trip, Day, Activity, Decision, DecisionOption, Question, Vote as VoteType, PackingItem } from "@/types/database";

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

function formatDate(dateStr: string, dayOfWeek: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const day = d.getDate();
  return `${dayOfWeek}, ${month} ${day}`;
}

function formatTime(time: string): string {
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

// --- Action Items (family-specific, prioritized) ---

interface ActionItem {
  type: "decision" | "question" | "flight" | "packing" | "activity";
  title: string;
  subtitle: string;
  href: string;
  urgency: "urgent" | "this_week" | "coming_up";
}

function computeActionItems(
  familyId: string | null,
  families: { id: string; name: string; arrival_flight: string | null; departure_flight: string | null }[],
  decisions: { decision: Decision; options: DecisionOption[]; votes: VoteType[] }[],
  questions: Question[],
  packingItems: PackingItem[],
  packingCheckedCount: number,
): ActionItem[] {
  const items: ActionItem[] = [];
  const allFamilyCount = families.length || NUM_FAMILIES;

  // --- Decision votes ---
  const openDecisions = decisions.filter((d) => d.decision.status === "open");
  for (const d of openDecisions) {
    const deadlineDate = d.decision.deadline ? new Date(d.decision.deadline) : null;
    const daysLeft = deadlineDate
      ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    // Check if THIS family has voted
    const familyHasVoted = familyId
      ? d.votes.some((v) => v.family_id === familyId)
      : false;

    if (familyId && familyHasVoted) continue; // Skip if already voted

    // Figure out who hasn't voted
    const votedFamilyIds = new Set(d.votes.map((v) => v.family_id));
    const missingFamilies = families.filter((f) => !votedFamilyIds.has(f.id));
    const waitingText = familyId && !familyHasVoted
      ? "You haven't voted yet"
      : missingFamilies.length > 0
        ? `Waiting on ${missingFamilies.map((f) => f.name).join(", ")}`
        : "Vote needed";

    const urgency: ActionItem["urgency"] =
      daysLeft !== null && daysLeft <= 0 ? "urgent"
        : daysLeft !== null && daysLeft <= 7 ? "this_week"
          : "coming_up";

    items.push({
      type: "decision",
      title: d.decision.title,
      subtitle: daysLeft !== null && daysLeft <= 0
        ? `Deadline passed — ${waitingText.toLowerCase()}`
        : waitingText,
      href: "/trip/decisions",
      urgency,
    });
  }

  // --- Unanswered questions (blocking) ---
  const unansweredCount = questions.filter((q) => q.status === "pending" || q.status === "asked").length;
  if (unansweredCount > 0) {
    items.push({
      type: "question",
      title: `${unansweredCount} question${unansweredCount > 1 ? "s" : ""} for Villa Escape`,
      subtitle: "Still awaiting answers",
      href: "/trip/logistics",
      urgency: "this_week",
    });
  }

  // --- New answers ---
  const answeredQuestions = questions.filter((q) => q.status === "answered");
  if (answeredQuestions.length > 0) {
    items.push({
      type: "question",
      title: `${answeredQuestions.length} new answer${answeredQuestions.length > 1 ? "s" : ""} from Villa Escape`,
      subtitle: "Review and mark resolved",
      href: "/trip/logistics",
      urgency: "this_week",
    });
  }

  // --- Missing flight info (family-specific) ---
  if (familyId) {
    const myFamily = families.find((f) => f.id === familyId);
    if (myFamily) {
      if (!myFamily.arrival_flight) {
        items.push({
          type: "flight",
          title: "Add your arrival flight details",
          subtitle: "Needed for transfer booking",
          href: "/trip/logistics",
          urgency: "this_week",
        });
      }
      if (!myFamily.departure_flight) {
        items.push({
          type: "flight",
          title: "Add your departure flight details",
          subtitle: "Needed for transfer booking",
          href: "/trip/logistics",
          urgency: "coming_up",
        });
      }
    }
  } else {
    // Show all missing flights
    const missingArrival = families.filter((f) => !f.arrival_flight);
    const missingDeparture = families.filter((f) => !f.departure_flight);
    if (missingArrival.length > 0) {
      items.push({
        type: "flight",
        title: `Missing arrival flights: ${missingArrival.map((f) => f.name).join(", ")}`,
        subtitle: "Needed for transfer booking",
        href: "/trip/logistics",
        urgency: "this_week",
      });
    }
    if (missingDeparture.length > 0) {
      items.push({
        type: "flight",
        title: `Missing departure flights: ${missingDeparture.map((f) => f.name).join(", ")}`,
        subtitle: "Needed for transfer booking",
        href: "/trip/logistics",
        urgency: "coming_up",
      });
    }
  }

  // --- Packing progress ---
  if (packingItems.length > 0 && packingCheckedCount < packingItems.length) {
    const pct = Math.round((packingCheckedCount / packingItems.length) * 100);
    items.push({
      type: "packing",
      title: pct === 0 ? "Review your packing list" : `Packing: ${packingCheckedCount}/${packingItems.length} items checked`,
      subtitle: pct === 0 ? `${packingItems.length} items to review` : `${packingItems.length - packingCheckedCount} remaining`,
      href: "/trip/logistics",
      urgency: "coming_up",
    });
  }

  // Sort by urgency
  const urgencyOrder = { urgent: 0, this_week: 1, coming_up: 2 };
  items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return items;
}

// --- Component ---

export default function HomePage() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<DayWithActivities[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [weather, setWeather] = useState<{ split: WeatherDay[]; dubrovnik: WeatherDay[] }>({
    split: [],
    dubrovnik: [],
  });
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const { currency, toggle: toggleCurrency, format: fmt } = useCurrency();
  const { family, families } = useFamily();

  const toggleActivity = useCallback((id: string) => {
    setExpandedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Fetch trip data
  useEffect(() => {
    async function load() {
      try {
        const code = localStorage.getItem(ACCESS_CODE_KEY);
        if (!code) return;

        const tripData = await getTripByAccessCode(code);
        if (!tripData) {
          localStorage.removeItem(ACCESS_CODE_KEY);
          return;
        }
        setTrip(tripData);

        const [daysData, decisionsData, questionsData, packingData] = await Promise.all([
          getDays(tripData.id),
          getDecisions(tripData.id),
          getQuestions(tripData.id),
          getPackingItems(tripData.id),
        ]);

        // Fetch activities for all days
        const daysWithActivities = await Promise.all(
          daysData.map(async (day) => {
            const activities = await getActivities(day.id);
            return { ...day, activities };
          })
        );
        setDays(daysWithActivities);

        // Fetch votes and options for decisions
        const decisionsWithDetails = await Promise.all(
          decisionsData.map(async (decision) => {
            const [options, votes] = await Promise.all([
              getDecisionOptions(decision.id),
              getVotes(decision.id),
            ]);
            return { decision, options, votes };
          })
        );

        // Compute packing progress for selected family
        const familyId = family?.id ?? localStorage.getItem("croatia2026_family_id");
        let packingCheckedCount = 0;
        if (familyId) {
          for (const item of packingData) {
            const key = `croatia2026_packed_${familyId}_${item.id}`;
            if (localStorage.getItem(key) === "true") packingCheckedCount++;
          }
        }

        // Build family-specific action items
        const items = computeActionItems(
          familyId,
          families.length > 0 ? families : [], // May not be loaded yet from context
          decisionsWithDetails,
          questionsData,
          packingData,
          packingCheckedCount,
        );
        setActionItems(items);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [family, families]);

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
        // Weather is non-critical
      }
    }
    fetchWeather();
  }, []);

  // Mode detection
  const now = new Date();
  const diffMs = TRIP_START.getTime() - now.getTime();
  const daysUntilTrip = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const todayStr = now.toISOString().split("T")[0];
  const tripEndDate = trip ? trip.end_date : "2026-07-26";
  const isTripMode = todayStr >= "2026-07-18" && todayStr <= tripEndDate;
  const isTripOver = todayStr > tripEndDate;
  const currentDayIndex = isTripMode ? days.findIndex((d) => d.date >= todayStr) : -1;
  const showWeather = isTripMode || daysUntilTrip <= 7;

  if (loading) return <LoadingSkeleton />;

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
      {/* Family-specific action items — the hero */}
      <ActionItemQueue
        items={actionItems}
        familyName={family?.name ?? null}
        daysUntilTrip={daysUntilTrip}
        isTripMode={isTripMode}
        isTripOver={isTripOver}
        currency={currency}
        toggleCurrency={toggleCurrency}
      />

      {/* Weather strip — only show when trip is ≤7 days away or during trip */}
      {showWeather && weather.split.length > 0 && (
        <WeatherStrip split={weather.split} dubrovnik={weather.dubrovnik} />
      )}

      {/* Day-by-day timeline */}
      <div className="space-y-4">
        {days.map((day, dayIdx) => {
          const isHighlighted = isTripMode && dayIdx === currentDayIndex;
          const isPast = isTripMode && day.date < todayStr;
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
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
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
                    <Badge className={`${locationColor} text-xs font-semibold uppercase tracking-wider`}>
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
                      formatCurrency={fmt}
                      familyChildrenAges={family?.children_ages ?? null}
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

// --- Action Item Queue (replaces countdown hero) ---

function ActionItemQueue({
  items,
  familyName,
  daysUntilTrip,
  isTripMode,
  isTripOver,
  currency,
  toggleCurrency,
}: {
  items: ActionItem[];
  familyName: string | null;
  daysUntilTrip: number;
  isTripMode: boolean;
  isTripOver: boolean;
  currency: string;
  toggleCurrency: () => void;
}) {
  const urgentItems = items.filter((i) => i.urgency === "urgent");
  const weekItems = items.filter((i) => i.urgency === "this_week");
  const laterItems = items.filter((i) => i.urgency === "coming_up");

  const iconForType = (type: ActionItem["type"]) => {
    switch (type) {
      case "decision": return <Vote className="h-4 w-4" />;
      case "question": return <MessageCircleQuestion className="h-4 w-4" />;
      case "flight": return <Plane className="h-4 w-4" />;
      case "packing": return <ClipboardList className="h-4 w-4" />;
      case "activity": return <CalendarDays className="h-4 w-4" />;
    }
  };

  const headline = isTripMode
    ? "Trip time!"
    : isTripOver
      ? "What a trip!"
      : `${daysUntilTrip} days to go`;

  return (
    <div className="space-y-4">
      {/* Compact header with countdown + currency */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{headline}</h1>
          {familyName && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Welcome, {familyName} family
            </p>
          )}
          {!familyName && (
            <p className="text-sm text-amber-600 mt-0.5">
              Select your family above to see personalized actions
            </p>
          )}
        </div>
        <button
          onClick={toggleCurrency}
          className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeftRight className="h-3 w-3" />
          {currency}
        </button>
      </div>

      {/* Action items grouped by urgency */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CircleCheck className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">You're all caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No actions needed right now. Check back later or scroll down to browse the itinerary.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Urgent */}
          {urgentItems.length > 0 && (
            <ActionGroup
              label="Urgent"
              icon={<CircleAlert className="h-3.5 w-3.5" />}
              className="text-red-700 bg-red-50 border-red-200"
              items={urgentItems}
              iconForType={iconForType}
              itemClassName="text-red-700 bg-red-50 border-red-200"
            />
          )}

          {/* This week */}
          {weekItems.length > 0 && (
            <ActionGroup
              label="This Week"
              icon={<CircleDot className="h-3.5 w-3.5" />}
              className="text-amber-700 bg-amber-50 border-amber-200"
              items={weekItems}
              iconForType={iconForType}
              itemClassName="text-amber-700 bg-amber-50 border-amber-200"
            />
          )}

          {/* Coming up */}
          {laterItems.length > 0 && (
            <ActionGroup
              label="Coming Up"
              icon={<CircleDot className="h-3.5 w-3.5" />}
              className="text-primary bg-primary/5 border-primary/15"
              items={laterItems}
              iconForType={iconForType}
              itemClassName="text-primary bg-primary/5 border-primary/15"
            />
          )}
        </div>
      )}
    </div>
  );
}

function ActionGroup({
  label,
  icon,
  className,
  items,
  iconForType,
  itemClassName,
}: {
  label: string;
  icon: React.ReactNode;
  className: string;
  items: ActionItem[];
  iconForType: (type: ActionItem["type"]) => React.ReactNode;
  itemClassName: string;
}) {
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${className.split(" ")[0]}`}>
        {icon}
        {label}
      </div>
      {items.map((item, i) => (
        <Link
          key={i}
          href={item.href}
          className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:opacity-80 ${itemClassName}`}
        >
          <div className="shrink-0">{iconForType(item.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight truncate">{item.title}</p>
            <p className="text-xs opacity-70 mt-0.5">{item.subtitle}</p>
          </div>
          <ChevronRight className="h-4 w-4 opacity-40 shrink-0" />
        </Link>
      ))}
    </div>
  );
}

// --- Activity Card ---

function ActivityCard({
  activity,
  expanded,
  onToggle,
  familyCount,
  formatCurrency,
  familyChildrenAges,
}: {
  activity: Activity;
  expanded: boolean;
  onToggle: () => void;
  familyCount: number;
  formatCurrency: (eur: number) => string;
  familyChildrenAges: number[] | null;
}) {
  const status = statusConfig[activity.status];
  const hasCost = activity.total_cost_eur != null && activity.total_cost_eur > 0;
  const perFamily = hasCost ? activity.total_cost_eur! / familyCount : 0;
  const hasDetails = activity.details && activity.details.trim().length > 0;
  const hasRestrictions = activity.restrictions && activity.restrictions.trim().length > 0;
  const hasWarnings = activity.warning_flags && activity.warning_flags.length > 0;
  const isCancelled = activity.status === "cancelled";

  // Family-specific age warning
  const ageWarning = familyChildrenAges && hasRestrictions
    ? checkAgeRestriction(activity.restrictions!, familyChildrenAges)
    : null;

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
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${status.className}`}>
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

          {hasCost && (
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-foreground">
                {formatCurrency(activity.total_cost_eur!)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatCurrency(perFamily)}/family
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Family-specific age warning */}
      {ageWarning && (
        <CardContent className="pt-0 -mt-2">
          <div className="flex items-start gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
            {ageWarning}
          </div>
        </CardContent>
      )}

      {/* Badges row */}
      {!ageWarning && (hasRestrictions || hasWarnings) && (
        <CardContent className="pt-0 -mt-2">
          <div className="flex flex-wrap gap-1.5">
            {hasRestrictions && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                {activity.restrictions}
              </span>
            )}
            {hasWarnings &&
              activity.warning_flags.map((flag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700"
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

/** Check if an activity's restriction text affects this family's children */
function checkAgeRestriction(restrictions: string, childrenAges: number[]): string | null {
  if (childrenAges.length === 0) return null;

  const lower = restrictions.toLowerCase();
  // Look for patterns like "minimum age 12", "ages 12+", "must be 16+"
  const ageMatch = lower.match(/(?:minimum\s*age|ages?|must\s*be)\s*(\d+)/);
  if (!ageMatch) return null;

  const minAge = parseInt(ageMatch[1], 10);
  const tooYoung = childrenAges.filter((age) => age < minAge);
  if (tooYoung.length === 0) return null;

  return `Your ${tooYoung.join(" & ")}-year-old${tooYoung.length > 1 ? "s" : ""} may not qualify — pending confirmation`;
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
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors min-h-[44px] ${
                showCity === "split"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setShowCity("dubrovnik")}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors min-h-[44px] ${
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
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  {dayName}
                </span>
                <span className="text-xs font-medium text-foreground">{dayNum}</span>
                <div title={weatherLabel(w.code)}>{weatherIcon(w.code)}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-foreground">{w.tempMax}°</span>
                  <span className="text-xs text-muted-foreground">{w.tempMin}°</span>
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
      {/* Action items skeleton */}
      <div>
        <div className="h-8 w-48 bg-muted rounded mb-2" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
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
              <div key={j} className="rounded-xl bg-card ring-1 ring-foreground/10 p-4 space-y-2">
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
