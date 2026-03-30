"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ChevronDown,
  Plus,
  Loader2,
  MessageCircle,
  MessageCircleQuestion,
} from "lucide-react";
import { getTripByAccessCode } from "@/lib/api";
import {
  getFamilies,
  getPackingItems,
  getDays,
  getRestaurantReservations,
  getQuestions,
  addQuestion,
  updateQuestionStatus,
} from "@/lib/api";
import { useFamily } from "@/lib/family-context";
import type { Trip, Family, PackingItem, Day, RestaurantReservation, Question } from "@/types/database";

const ACCESS_CODE_KEY = "croatia2026_access_code";

// ============================================================
// FLIGHTS SECTION
// ============================================================

function FlightsSection({ families, selectedFamilyId }: { families: Family[]; selectedFamilyId: string | null }) {
  // Show only selected family's flights, or all if no family selected
  const relevantFamilies = selectedFamilyId
    ? families.filter((f) => f.id === selectedFamilyId)
    : families;

  const otherFamilies = selectedFamilyId
    ? families.filter((f) => f.id !== selectedFamilyId)
    : [];

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

  return (
    <div className="space-y-6">
      {/* Your family's flights */}
      {relevantFamilies.map((fam) => (
        <Card key={fam.id} className={selectedFamilyId ? "border-primary/20 bg-primary/[0.02]" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plane className="h-4 w-4 text-primary" />
              {fam.name} Family
              <span className="text-xs text-muted-foreground font-normal">
                {fam.adults} adults{fam.children > 0 ? `, ${fam.children} child${fam.children > 1 ? "ren" : ""}` : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Arrival */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Arrival</p>
              {fam.arrival_datetime ? (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0">
                      {fam.arrival_flight ?? "TBD"}
                    </Badge>
                    <span className="text-muted-foreground">{fam.arrival_airport ?? "Airport TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDatetime(fam.arrival_datetime)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-amber-600">No arrival flight details yet</p>
              )}
            </div>

            <Separator />

            {/* Departure */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Departure</p>
              {fam.departure_datetime ? (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0">
                      {fam.departure_flight ?? "TBD"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDatetime(fam.departure_datetime)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-amber-600">No departure flight details yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Other families (collapsed) */}
      {otherFamilies.length > 0 && (
        <CollapsibleSection
          title={`Other Families (${otherFamilies.length})`}
          defaultOpen={false}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {otherFamilies.map((fam) => (
              <Card key={fam.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-sm">{fam.name}</p>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {fam.arrival_flight ?? "TBD"}
                    </Badge>
                  </div>
                  {fam.arrival_datetime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Arrives {formatDatetime(fam.arrival_datetime)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

// ============================================================
// PACKING CHECKLIST
// ============================================================

const PACKING_CATEGORY_LABELS: Record<string, string> = {
  essential: "Essential",
  activity_specific: "Activity-Specific",
  comfort: "Comfort",
  documents: "Documents",
};

const PACKING_CATEGORY_ORDER = ["essential", "documents", "activity_specific", "comfort"];

function PackingSection({
  packingItems,
  familyId,
}: {
  packingItems: PackingItem[];
  familyId: string | null;
}) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!familyId) return;
    const loaded: Record<string, boolean> = {};
    for (const item of packingItems) {
      const key = `croatia2026_packed_${familyId}_${item.id}`;
      loaded[item.id] = localStorage.getItem(key) === "true";
    }
    setCheckedItems(loaded);
  }, [familyId, packingItems]);

  function toggleItem(itemId: string) {
    if (!familyId) return;
    const key = `croatia2026_packed_${familyId}_${itemId}`;
    const newVal = !checkedItems[itemId];
    localStorage.setItem(key, String(newVal));
    setCheckedItems((prev) => ({ ...prev, [itemId]: newVal }));
  }

  const grouped = PACKING_CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: PACKING_CATEGORY_LABELS[cat] ?? cat,
    items: packingItems.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  const totalItems = packingItems.length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  if (!familyId) {
    return (
      <p className="text-sm text-amber-600">
        Select your family above to track your packing progress.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Progress value={progressPct}>
        <ProgressLabel>Packed</ProgressLabel>
        <ProgressValue>
          {() => `${checkedCount} / ${totalItems}`}
        </ProgressValue>
      </Progress>

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

// ============================================================
// RESTAURANTS (Enhanced with WhatsApp share)
// ============================================================

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
    days.map((d) => [d.id, { label: `Day ${d.day_number} - ${d.day_of_week}`, date: d.date, dayNumber: d.day_number }])
  );

  const byDay = new Map<string, RestaurantReservation[]>();
  for (const r of reservations) {
    const key = r.day_id ?? "__unassigned";
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(r);
  }

  const sortedKeys = Array.from(byDay.keys()).sort((a, b) => {
    const da = a === "__unassigned" ? 999 : (dayMap[a]?.dayNumber ?? 999);
    const db = b === "__unassigned" ? 999 : (dayMap[b]?.dayNumber ?? 999);
    return da - db;
  });

  function formatTime(timeStr: string) {
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return timeStr;
    }
  }

  function shareReservation(r: RestaurantReservation) {
    const dayInfo = r.day_id ? dayMap[r.day_id] : null;
    let text = `\uD83C\uDF7D\uFE0F Dinner: ${r.restaurant_name}\n`;
    text += `\u23F0 ${formatTime(r.time)}`;
    if (dayInfo) text += ` (${dayInfo.label})`;
    text += `\n\uD83D\uDC65 ${r.num_people} people`;
    if (r.booked_by_family_id) text += `\n\uD83D\uDCDD Reserved under ${familyMap[r.booked_by_family_id] ?? "Unknown"}`;
    if (r.notes) text += `\n\u2139\uFE0F ${r.notes}`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }

  function statusBadgeClass(status: "pending" | "confirmed" | "cancelled") {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-700 border-green-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-amber-700">
          <span className="font-medium">16 people in peak July</span> — advance
          reservations are essential. Book popular spots at least 2 weeks ahead.
        </p>
      </div>

      {sortedKeys.length === 0 && (
        <p className="text-sm text-muted-foreground">No restaurant reservations yet.</p>
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
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold">{r.restaurant_name}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(r.time)}
                          </span>
                          <span>{r.num_people} people</span>
                        </div>
                        {r.notes && (
                          <p className="text-xs text-muted-foreground">{r.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusBadgeClass(r.confirmation_status)}>
                          {r.confirmation_status.charAt(0).toUpperCase() + r.confirmation_status.slice(1)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                          onClick={() => shareReservation(r)}
                          title="Share on WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
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

// ============================================================
// QUESTIONS FOR VILLA ESCAPE (moved from separate page)
// ============================================================

type QuestionStatus = "pending" | "asked" | "answered" | "resolved";

const STATUS_NEXT: Record<QuestionStatus, QuestionStatus> = {
  pending: "asked",
  asked: "answered",
  answered: "resolved",
  resolved: "pending",
};

const STATUS_CONFIG: Record<
  QuestionStatus,
  { label: string; className: string; emoji: string }
> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200", emoji: "\u23F3" },
  asked: { label: "Asked", className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200", emoji: "\uD83D\uDCE8" },
  answered: { label: "Answered", className: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200", emoji: "\u2705" },
  resolved: { label: "Resolved", className: "bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200", emoji: "\u2714\uFE0F" },
};

function QuestionsSection({
  questions,
  tripId,
  families,
  onQuestionsChange,
}: {
  questions: Question[];
  tripId: string | null;
  families: Family[];
  onQuestionsChange: (questions: Question[]) => void;
}) {
  const [newQuestion, setNewQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const familyMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const f of families) m[f.id] = f.name;
    return m;
  }, [families]);

  const grouped = useMemo(() => {
    const map: Record<QuestionStatus, Question[]> = { pending: [], asked: [], answered: [], resolved: [] };
    for (const q of questions) {
      const status = q.status as QuestionStatus;
      if (map[status]) map[status].push(q);
    }
    return map;
  }, [questions]);

  const STATUS_ORDER: QuestionStatus[] = ["pending", "asked", "answered", "resolved"];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim() || !tripId) return;
    setSubmitting(true);
    const result = await addQuestion(tripId, newQuestion.trim());
    if (result) {
      onQuestionsChange([result, ...questions]);
      setNewQuestion("");
    }
    setSubmitting(false);
  }

  async function handleStatusCycle(question: Question) {
    const current = question.status as QuestionStatus;
    const next = STATUS_NEXT[current];
    const result = await updateQuestionStatus(question.id, next);
    if (result) {
      onQuestionsChange(questions.map((q) => (q.id === result.id ? result : q)));
    }
  }

  function handleShareWhatsApp() {
    const lines: string[] = ["Questions for Villa Escape:", ""];
    let num = 1;
    for (const status of STATUS_ORDER) {
      const items = grouped[status];
      if (items.length === 0) continue;
      for (const q of items) {
        const cfg = STATUS_CONFIG[status];
        lines.push(`${num}. ${cfg.emoji} ${q.question}`);
        if (q.answer) lines.push(`   Answer: ${q.answer}`);
        num++;
      }
    }
    const encoded = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Villa Escape Questions</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareWhatsApp}
          className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300"
          disabled={questions.length === 0}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share on WhatsApp</span>
          <span className="sm:hidden">Share</span>
        </Button>
      </div>

      {/* Add question */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder="Type a new question..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          disabled={submitting}
          className="flex-1"
        />
        <Button type="submit" disabled={submitting || !newQuestion.trim()} size="default">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </form>

      {/* Grouped questions */}
      {STATUS_ORDER.map((status) => {
        const items = grouped[status];
        if (items.length === 0) return null;
        const cfg = STATUS_CONFIG[status];
        return (
          <div key={status} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cfg.className}>{cfg.label}</Badge>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            {items.map((q) => (
              <Card key={q.id}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm font-medium leading-snug">{q.question}</p>
                      {q.answer && (
                        <div className="rounded-md bg-green-50 border border-green-100 p-2.5">
                          <p className="text-xs font-medium text-green-700 mb-0.5">Answer</p>
                          <p className="text-sm text-green-900">{q.answer}</p>
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleStatusCycle(q)} className="shrink-0">
                      <Badge variant="secondary" className={`cursor-pointer transition-colors ${STATUS_CONFIG[q.status as QuestionStatus].className}`}>
                        {STATUS_CONFIG[q.status as QuestionStatus].label}
                      </Badge>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}

      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No questions yet. Add one above!
        </p>
      )}
    </div>
  );
}

// ============================================================
// EMERGENCY INFO (collapsible)
// ============================================================

const EMERGENCY_NUMBERS = [
  { label: "General Emergency", number: "112" },
  { label: "Police", number: "192" },
  { label: "Ambulance", number: "194" },
  { label: "Fire", number: "193" },
];

const HOSPITALS = [
  { city: "Split", name: "KBC Split", address: "Spinčićeva 1", phone: "021-556-111" },
  { city: "Dubrovnik", name: "Opća bolnica Dubrovnik", address: "Dr. Roka Mišetića 2", phone: "020-431-777" },
];

const EMBASSIES = [
  { country: "Ireland", location: "Rome (nearest)", phone: "+39 06 585 2381" },
  { country: "India", location: "Zagreb", phone: "+385 1 4873 239" },
  { country: "United States", location: "Zagreb", phone: "+385 1 661 2200" },
];

function EmergencySection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EMERGENCY_NUMBERS.map((e) => (
          <a
            key={e.number}
            href={`tel:${e.number}`}
            className="flex flex-col items-center rounded-lg border border-red-100 bg-red-50 p-3 text-center transition-colors hover:bg-red-100"
          >
            <span className="text-2xl font-bold text-red-700">{e.number}</span>
            <span className="mt-1 text-xs font-medium text-red-600">{e.label}</span>
          </a>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {HOSPITALS.map((h) => (
          <div key={h.city} className="rounded-lg border p-3 space-y-1">
            <p className="font-semibold text-sm">{h.name}</p>
            <p className="text-xs text-muted-foreground">{h.city} — {h.address}</p>
            <a href={`tel:${h.phone}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <Phone className="h-3 w-3" />{h.phone}
            </a>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {EMBASSIES.map((e) => (
          <div key={e.country} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">{e.country}</p>
              <p className="text-xs text-muted-foreground">{e.location}</p>
            </div>
            <a href={`tel:${e.phone.replace(/\s/g, "")}`} className="text-xs font-medium text-primary hover:underline">
              {e.phone}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// QUICK REFERENCE INFO (collapsible)
// ============================================================

const USEFUL_INFO = [
  { label: "Currency", value: "Euro (EUR)", detail: "Croatia adopted the Euro in January 2023." },
  { label: "Time Zone", value: "CEST (UTC+2)", detail: "Central European Summer Time during July." },
  { label: "Language", value: "Croatian", detail: "Most people in tourist areas speak English." },
  { label: "Tipping", value: "10-15% in restaurants", detail: "Not mandatory but appreciated." },
  { label: "Tap Water", value: "Safe to drink", detail: "Tap water is safe throughout Croatia." },
  { label: "Power", value: "EU Type C/F plugs, 230V", detail: "Bring EU adapters from US/UK/India." },
];

function QuickReferenceSection() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {USEFUL_INFO.map((info) => (
        <div key={info.label} className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{info.label}</p>
          <p className="text-sm font-semibold">{info.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{info.detail}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// COLLAPSIBLE SECTION HELPER
// ============================================================

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
  badge,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
          {badge}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN LOGISTICS PAGE
// ============================================================

export default function LogisticsPage() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [allFamilies, setAllFamilies] = useState<Family[]>([]);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [reservations, setReservations] = useState<RestaurantReservation[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { family } = useFamily();

  const loadData = useCallback(async () => {
    try {
      const code = localStorage.getItem(ACCESS_CODE_KEY);
      if (!code) {
        setError("No access code found.");
        setLoading(false);
        return;
      }

      const tripData = await getTripByAccessCode(code);
      if (!tripData) {
        setError("Trip not found.");
        setLoading(false);
        return;
      }

      setTrip(tripData);

      const [fams, items, tripDays, resos, qs] = await Promise.all([
        getFamilies(tripData.id),
        getPackingItems(tripData.id),
        getDays(tripData.id),
        getRestaurantReservations(tripData.id),
        getQuestions(tripData.id),
      ]);

      setAllFamilies(fams);
      setPackingItems(items);
      setDays(tripDays);
      setReservations(resos);
      setQuestions(qs);
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

  // Count pending/asked questions for badge
  const pendingQuestionCount = questions.filter(
    (q) => q.status === "pending" || q.status === "asked"
  ).length;
  const answeredQuestionCount = questions.filter((q) => q.status === "answered").length;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Logistics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need for {trip?.name ?? "the trip"}.
        </p>
      </div>

      {/* Flights — primary section, family-specific */}
      <CollapsibleSection
        title="Flights"
        icon={<Plane className="h-4 w-4 text-primary" />}
        defaultOpen={true}
      >
        <FlightsSection families={allFamilies} selectedFamilyId={family?.id ?? null} />
      </CollapsibleSection>

      {/* Restaurants — enhanced */}
      <CollapsibleSection
        title="Restaurant Bookings"
        icon={<Utensils className="h-4 w-4 text-primary" />}
        defaultOpen={true}
        badge={
          reservations.length > 0 ? (
            <Badge variant="secondary" className="text-xs ml-1">{reservations.length}</Badge>
          ) : null
        }
      >
        <RestaurantsSection reservations={reservations} days={days} families={allFamilies} />
      </CollapsibleSection>

      {/* Packing — family-specific */}
      <CollapsibleSection
        title="Packing List"
        icon={<Luggage className="h-4 w-4 text-primary" />}
        defaultOpen={false}
      >
        <PackingSection packingItems={packingItems} familyId={family?.id ?? null} />
      </CollapsibleSection>

      {/* Questions for Villa Escape — moved from separate tab */}
      <CollapsibleSection
        title="Villa Escape Questions"
        icon={<MessageCircleQuestion className="h-4 w-4 text-primary" />}
        defaultOpen={pendingQuestionCount > 0 || answeredQuestionCount > 0}
        badge={
          (pendingQuestionCount > 0 || answeredQuestionCount > 0) ? (
            <Badge
              variant="secondary"
              className={`text-xs ml-1 ${answeredQuestionCount > 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
            >
              {answeredQuestionCount > 0 ? `${answeredQuestionCount} answered` : `${pendingQuestionCount} pending`}
            </Badge>
          ) : null
        }
      >
        <QuestionsSection
          questions={questions}
          tripId={trip?.id ?? null}
          families={allFamilies}
          onQuestionsChange={setQuestions}
        />
      </CollapsibleSection>

      {/* Emergency — collapsed */}
      <CollapsibleSection
        title="Emergency Info"
        icon={<Shield className="h-4 w-4 text-red-500" />}
        defaultOpen={false}
      >
        <EmergencySection />
      </CollapsibleSection>

      {/* Quick Reference — collapsed */}
      <CollapsibleSection
        title="Quick Reference"
        icon={<Info className="h-4 w-4 text-muted-foreground" />}
        defaultOpen={false}
      >
        <QuickReferenceSection />
      </CollapsibleSection>
    </div>
  );
}
