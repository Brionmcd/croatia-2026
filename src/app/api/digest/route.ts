import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TRIP_START = new Date("2026-07-18T00:00:00");
const TRIP_END = new Date("2026-07-26T00:00:00");

export async function GET(request: NextRequest) {
  const accessCode = request.nextUrl.searchParams.get("code");
  if (!accessCode) {
    return NextResponse.json({ error: "Missing access code" }, { status: 400 });
  }

  // Get trip
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("access_code", accessCode)
    .single();

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  // Fetch all relevant data in parallel
  const [
    { data: families },
    { data: decisions },
    { data: questions },
    { data: reservations },
  ] = await Promise.all([
    supabase.from("families").select("*").eq("trip_id", trip.id),
    supabase.from("decisions").select("*").eq("trip_id", trip.id),
    supabase.from("questions").select("*").eq("trip_id", trip.id),
    supabase.from("restaurant_reservations").select("*").eq("trip_id", trip.id),
  ]);

  // Get votes for open decisions
  const openDecisions = (decisions ?? []).filter((d: { status: string }) => d.status === "open");
  const decisionVotes: Record<string, { family_id: string }[]> = {};
  for (const d of openDecisions) {
    const { data: votes } = await supabase
      .from("votes")
      .select("family_id")
      .eq("decision_id", d.id);
    decisionVotes[d.id] = votes ?? [];
  }

  const now = new Date();
  const daysUntil = Math.ceil((TRIP_START.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const todayStr = now.toISOString().split("T")[0];

  // Determine phase
  let phase: "early_planning" | "pre_trip" | "during_trip" | "post_trip";
  if (todayStr > "2026-07-26") {
    phase = "post_trip";
  } else if (todayStr >= "2026-07-18") {
    phase = "during_trip";
  } else if (daysUntil <= 30) {
    phase = "pre_trip";
  } else {
    phase = "early_planning";
  }

  // Build digest
  const lines: string[] = [];
  const fams = families ?? [];
  const qs = questions ?? [];
  const resos = reservations ?? [];

  lines.push(`\uD83C\uDDED\uD83C\uDDF7 Croatia 2026 \u2014 ${daysUntil > 0 ? `${daysUntil} days out` : "Trip time!"}`);
  lines.push("");

  // --- Decisions needing votes ---
  if (openDecisions.length > 0) {
    lines.push(`\uD83D\uDDF3\uFE0F ${openDecisions.length} decision${openDecisions.length > 1 ? "s" : ""} still need votes:`);
    for (const d of openDecisions) {
      const votes = decisionVotes[d.id] ?? [];
      const votedFamilyIds = new Set(votes.map((v: { family_id: string }) => v.family_id));
      const missing = fams.filter((f: { id: string; name: string }) => !votedFamilyIds.has(f.id));
      const missingNames = missing.map((f: { name: string }) => f.name).join(" & ");
      lines.push(`\u2022 ${d.title}${missing.length > 0 ? ` (${missingNames} haven\u2019t voted)` : ""}`);
    }
    lines.push("");
  }

  // --- Unanswered questions ---
  const unanswered = qs.filter((q: { status: string }) => q.status === "pending" || q.status === "asked");
  if (unanswered.length > 0) {
    lines.push(`\u2753 ${unanswered.length} question${unanswered.length > 1 ? "s" : ""} for Villa Escape still unanswered:`);
    for (const q of unanswered.slice(0, 5)) {
      const truncated = q.question.length > 60 ? q.question.slice(0, 57) + "..." : q.question;
      lines.push(`\u2022 ${truncated}`);
    }
    if (unanswered.length > 5) {
      lines.push(`  ...and ${unanswered.length - 5} more`);
    }
    lines.push("");
  }

  // --- New answers ---
  const answered = qs.filter((q: { status: string }) => q.status === "answered");
  if (answered.length > 0) {
    lines.push(`\u2705 ${answered.length} new answer${answered.length > 1 ? "s" : ""} from Villa Escape \u2014 check the app!`);
    lines.push("");
  }

  // --- Missing flight info ---
  const missingArrival = fams.filter((f: { arrival_flight: string | null }) => !f.arrival_flight);
  const missingDeparture = fams.filter((f: { departure_flight: string | null }) => !f.departure_flight);
  if (missingArrival.length > 0 || missingDeparture.length > 0) {
    lines.push(`\u2708\uFE0F Missing flight info:`);
    if (missingArrival.length > 0) {
      lines.push(`\u2022 ${missingArrival.map((f: { name: string }) => f.name).join(", ")} \u2014 no arrival flight`);
    }
    if (missingDeparture.length > 0) {
      lines.push(`\u2022 ${missingDeparture.map((f: { name: string }) => f.name).join(", ")} \u2014 no departure flight`);
    }
    lines.push("");
  }

  // --- Phase-specific content ---
  if (phase === "pre_trip") {
    // Restaurant status
    const confirmed = resos.filter((r: { confirmation_status: string }) => r.confirmation_status === "confirmed").length;
    const pending = resos.filter((r: { confirmation_status: string }) => r.confirmation_status === "pending").length;
    if (pending > 0) {
      lines.push(`\uD83C\uDF7D\uFE0F Restaurants: ${confirmed} confirmed, ${pending} still pending`);
      lines.push("");
    }
  }

  // --- Per-family estimate ---
  const { data: budgetItems } = await supabase
    .from("budget_items")
    .select("amount_eur")
    .eq("trip_id", trip.id);

  if (budgetItems && budgetItems.length > 0) {
    const total = budgetItems.reduce((s: number, i: { amount_eur: number }) => s + i.amount_eur, 0);
    const perFamily = Math.round(total / 4);
    lines.push(`\uD83D\uDCB0 Per-family estimate: ~\u20AC${perFamily.toLocaleString()}`);
    if (openDecisions.length > 0) {
      lines.push(`   (pending ${openDecisions.length} decision${openDecisions.length > 1 ? "s" : ""})`);
    }
    lines.push("");
  }

  // --- CTA ---
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://croatia-2026-theta.vercel.app";
  lines.push(`\u2192 Open the hub: ${appUrl}`);

  const digest = lines.join("\n");

  return NextResponse.json({ digest, phase, daysUntil });
}
