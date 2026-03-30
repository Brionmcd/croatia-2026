"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Vote, Check, Clock, ThumbsUp, MessageCircle, Sparkles } from "lucide-react";
import {
  getTripByAccessCode,
  getDecisions,
  getDecisionOptions,
  getVotes,
  getFamilies,
  castVote,
} from "@/lib/api";
import type {
  Trip,
  Family,
  Decision,
  DecisionOption,
  Vote as VoteType,
} from "@/types/database";

// Aggregated decision data for rendering
interface DecisionWithDetails {
  decision: Decision;
  options: DecisionOption[];
  votes: VoteType[];
}

interface Recommendation {
  optionId: string;
  reason: string;
  confidence: "high" | "medium";
}

// --- Smart Recommendation Engine ---
// Scores options based on cost, pros/cons, and kid-friendliness
function getRecommendation(options: DecisionOption[]): Recommendation | null {
  if (options.length < 2) return null;

  const scored = options.map((opt) => {
    let score = 0;
    let reasons: string[] = [];

    // Count pros and cons (split by comma, semicolon, or period)
    const proCount = opt.pros ? opt.pros.split(/[,;.]/).filter((s) => s.trim()).length : 0;
    const conCount = opt.cons ? opt.cons.split(/[,;.]/).filter((s) => s.trim()).length : 0;

    // Pros/cons balance
    score += (proCount - conCount) * 15;
    if (proCount > 0 && conCount === 0) {
      reasons.push("no downsides");
    }

    // Cost efficiency — lower cost is better, but only if meaningfully different
    if (opt.cost_eur != null) {
      const allCosts = options.filter((o) => o.cost_eur != null).map((o) => o.cost_eur!);
      const minCost = Math.min(...allCosts);
      const maxCost = Math.max(...allCosts);
      if (maxCost > minCost && maxCost - minCost > 50) {
        // Normalize: cheapest gets +20, most expensive gets 0
        const costScore = ((maxCost - opt.cost_eur!) / (maxCost - minCost)) * 20;
        score += costScore;
        if (opt.cost_eur === minCost && maxCost - minCost > 100) {
          reasons.push(`saves ${"\u20AC"}${(maxCost - minCost).toLocaleString()}`);
        }
      }
    }

    // Kid-friendliness — check cons for age/restriction keywords
    const consLower = (opt.cons ?? "").toLowerCase();
    const hasKidIssue =
      consLower.includes("age") ||
      consLower.includes("child") ||
      consLower.includes("kid") ||
      consLower.includes("restriction") ||
      consLower.includes("young") ||
      consLower.includes("minimum");
    if (hasKidIssue) {
      score -= 25;
    }
    if (!hasKidIssue && options.some((o) => {
      const c = (o.cons ?? "").toLowerCase();
      return c.includes("age") || c.includes("child") || c.includes("restriction");
    })) {
      reasons.push("kid-friendly");
      score += 10;
    }

    // Pros quality — longer/more detailed pros suggest more value
    if (proCount >= 2) {
      reasons.push(`${proCount} advantages`);
    }

    return { option: opt, score, reasons };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const runnerUp = scored[1];
  const gap = best.score - runnerUp.score;

  // Only recommend if there's a meaningful gap
  if (gap < 8) return null;

  const confidence = gap >= 20 ? "high" : "medium";
  const reason = best.reasons.length > 0
    ? best.reasons.slice(0, 2).join(" and ")
    : "best overall value";

  return {
    optionId: best.option.id,
    reason: reason.charAt(0).toUpperCase() + reason.slice(1),
    confidence,
  };
}

// --- WhatsApp helpers ---
function openWhatsApp(text: string) {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

export default function DecisionsPage() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [decisions, setDecisions] = useState<DecisionWithDetails[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [votingInProgress, setVotingInProgress] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const code = localStorage.getItem("croatia2026_access_code");
    if (!code) {
      setLoading(false);
      return;
    }

    const tripData = await getTripByAccessCode(code);
    if (!tripData) {
      setLoading(false);
      return;
    }
    setTrip(tripData);

    const [allDecisions, allFamilies] = await Promise.all([
      getDecisions(tripData.id),
      getFamilies(tripData.id),
    ]);
    setFamilies(allFamilies);

    // Fetch options and votes for each decision in parallel
    const decisionsWithDetails: DecisionWithDetails[] = await Promise.all(
      allDecisions.map(async (decision) => {
        const [options, votes] = await Promise.all([
          getDecisionOptions(decision.id),
          getVotes(decision.id),
        ]);
        return { decision, options, votes };
      })
    );
    setDecisions(decisionsWithDetails);

    // Restore saved family selection
    const savedFamilyId = localStorage.getItem("croatia2026_family_id");
    if (savedFamilyId && allFamilies.some((f) => f.id === savedFamilyId)) {
      setSelectedFamilyId(savedFamilyId);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pre-compute recommendations for all open decisions
  const recommendations = useMemo(() => {
    const map: Record<string, Recommendation> = {};
    for (const d of decisions) {
      if (d.decision.status === "open") {
        const rec = getRecommendation(d.options);
        if (rec) map[d.decision.id] = rec;
      }
    }
    return map;
  }, [decisions]);

  function handleFamilyChange(familyId: string | null) {
    if (!familyId) return;
    setSelectedFamilyId(familyId);
    localStorage.setItem("croatia2026_family_id", familyId);
  }

  async function handleVote(decisionId: string, optionId: string) {
    if (!selectedFamilyId) return;
    setVotingInProgress(decisionId);

    const result = await castVote(decisionId, optionId, selectedFamilyId);
    if (result) {
      // Refresh votes for this decision
      const newVotes = await getVotes(decisionId);
      setDecisions((prev) =>
        prev.map((d) =>
          d.decision.id === decisionId ? { ...d, votes: newVotes } : d
        )
      );
    }
    setVotingInProgress(null);
  }

  function handleShareWhatsApp(d: DecisionWithDetails) {
    const rec = recommendations[d.decision.id];
    const recOption = rec ? d.options.find((o) => o.id === rec.optionId) : null;
    const url = typeof window !== "undefined" ? window.location.origin + "/trip/decisions" : "";

    let text = `\u{1F5F3}\uFE0F *${d.decision.title}*\n`;
    if (d.decision.description) {
      text += `${d.decision.description}\n`;
    }
    text += "\n";

    if (recOption && rec) {
      text += `\u2B50 *Recommended: ${recOption.title}*\n`;
      text += `${rec.reason}`;
      if (recOption.cost_eur != null) {
        text += ` \u00B7 ${"\u20AC"}${recOption.cost_eur.toLocaleString()}`;
      }
      text += "\n\n";
      const otherOptions = d.options.filter((o) => o.id !== rec.optionId);
      if (otherOptions.length > 0) {
        text += "Other options:\n";
        for (const o of otherOptions) {
          text += `  \u2022 ${o.title}`;
          if (o.cost_eur != null) text += ` (${"\u20AC"}${o.cost_eur.toLocaleString()})`;
          text += "\n";
        }
        text += "\n";
      }
    } else {
      text += "Options:\n";
      for (const o of d.options) {
        text += `  \u2022 ${o.title}`;
        if (o.cost_eur != null) text += ` (${"\u20AC"}${o.cost_eur.toLocaleString()})`;
        text += "\n";
      }
      text += "\n";
    }

    text += `Vote here: ${url}`;

    openWhatsApp(text);
  }

  // Helpers
  function getFamilyVote(
    votes: VoteType[],
    familyId: string
  ): VoteType | undefined {
    return votes.find((v) => v.family_id === familyId);
  }

  function getMyVote(votes: VoteType[]): VoteType | undefined {
    if (!selectedFamilyId) return undefined;
    return votes.find((v) => v.family_id === selectedFamilyId);
  }

  function getVoteCountForOption(votes: VoteType[], optionId: string): number {
    return votes.filter((v) => v.option_id === optionId).length;
  }

  function getWinningOption(d: DecisionWithDetails): DecisionOption | null {
    if (d.decision.decided_option_id) {
      return d.options.find((o) => o.id === d.decision.decided_option_id) ?? null;
    }
    if (d.votes.length >= families.length && families.length > 0) {
      const counts: Record<string, number> = {};
      for (const v of d.votes) {
        counts[v.option_id] = (counts[v.option_id] ?? 0) + 1;
      }
      let maxCount = 0;
      let winnerId = "";
      for (const optionId of Object.keys(counts)) {
        if (counts[optionId] > maxCount) {
          maxCount = counts[optionId];
          winnerId = optionId;
        }
      }
      return d.options.find((o) => o.id === winnerId) ?? null;
    }
    return null;
  }

  function formatDeadline(deadline: string | null): string | null {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (diffDays < 0) return `Deadline passed (${formatted})`;
    if (diffDays === 0) return `Due today`;
    if (diffDays === 1) return `Due tomorrow`;
    if (diffDays <= 7) return `${diffDays} days left (${formatted})`;
    return `Due ${formatted}`;
  }

  // Separate open vs decided
  const openDecisions = decisions.filter((d) => d.decision.status === "open");
  const decidedDecisions = decisions.filter((d) => d.decision.status === "decided");
  const expiredDecisions = decisions.filter((d) => d.decision.status === "expired");

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Vote className="h-12 w-12 text-primary/30 mb-4 animate-pulse" />
        <p className="text-muted-foreground">Loading decisions...</p>
      </div>
    );
  }

  // No trip
  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Vote className="h-12 w-12 text-primary/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Decisions</h1>
        <p className="mt-2 text-muted-foreground">
          No trip found. Please enter an access code first.
        </p>
      </div>
    );
  }

  // No decisions
  if (decisions.length === 0) {
    return (
      <div className="space-y-6">
        <FamilySelector
          families={families}
          selectedFamilyId={selectedFamilyId}
          onChange={handleFamilyChange}
        />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Vote className="h-12 w-12 text-primary/20 mb-4" />
          <h2 className="text-lg font-semibold text-foreground">No Decisions Yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Decisions will appear here when the group needs to vote on something.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Decisions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          We've analyzed each option for you. Vote or share to WhatsApp.
        </p>
      </div>

      {/* Family selector */}
      <FamilySelector
        families={families}
        selectedFamilyId={selectedFamilyId}
        onChange={handleFamilyChange}
      />

      {/* No family selected warning */}
      {!selectedFamilyId && (
        <Card className="border-amber-500/50 bg-amber-50">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-amber-700">
              Select your family above to vote on decisions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Open decisions */}
      {openDecisions.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold text-foreground">
            Needs Your Input ({openDecisions.length})
          </h2>
          {openDecisions.map((d) => {
            const myVote = getMyVote(d.votes);
            const allVoted = d.votes.length >= families.length && families.length > 0;
            const winner = allVoted ? getWinningOption(d) : null;
            const deadline = formatDeadline(d.decision.deadline);
            const rec = recommendations[d.decision.id];

            return (
              <Card key={d.decision.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight">
                        {d.decision.title}
                      </CardTitle>
                      {d.decision.description && (
                        <CardDescription className="mt-1">
                          {d.decision.description}
                        </CardDescription>
                      )}
                    </div>
                    {deadline && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {deadline}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Recommendation banner */}
                  {rec && !allVoted && (
                    <div className="rounded-lg bg-primary/5 border border-primary/15 p-3">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">
                            Recommended: {d.options.find((o) => o.id === rec.optionId)?.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {rec.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All voted result */}
                  {allVoted && winner && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-sm font-medium text-green-800 flex items-center gap-1.5">
                        <Check className="h-4 w-4" />
                        All families voted — {winner.title} wins!
                      </p>
                    </div>
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {d.options.map((option) => {
                      const isMyVote = myVote?.option_id === option.id;
                      const voteCount = getVoteCountForOption(d.votes, option.id);
                      const isWinner = winner?.id === option.id;
                      const isRecommended = rec?.optionId === option.id;
                      const isVoting = votingInProgress === d.decision.id;

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleVote(d.decision.id, option.id)}
                          disabled={!selectedFamilyId || isVoting}
                          className={`
                            relative text-left rounded-lg border-2 p-4 transition-all
                            ${
                              isMyVote
                                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                : isWinner
                                ? "border-green-500 bg-green-50"
                                : isRecommended
                                ? "border-primary/30 bg-primary/[0.02]"
                                : "border-border hover:border-primary/40 hover:bg-accent/50"
                            }
                            ${!selectedFamilyId ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                            ${isVoting ? "animate-pulse" : ""}
                          `}
                        >
                          {/* Top-right badges */}
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            {isRecommended && !isMyVote && (
                              <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                                Best
                              </span>
                            )}
                            {isMyVote && (
                              <div className="bg-primary text-white rounded-full p-0.5">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="font-semibold text-sm pr-12">
                              {option.title}
                            </div>

                            {option.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {option.description}
                              </p>
                            )}

                            {option.cost_eur != null && (
                              <p className="text-sm font-medium">
                                {"\u20AC"}{option.cost_eur.toLocaleString()}
                              </p>
                            )}

                            {option.pros && (
                              <p className="text-xs text-green-700">
                                + {option.pros}
                              </p>
                            )}

                            {option.cons && (
                              <p className="text-xs text-red-600">
                                - {option.cons}
                              </p>
                            )}

                            {voteCount > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <ThumbsUp className="h-3 w-3" />
                                {voteCount} vote{voteCount !== 1 ? "s" : ""}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Vote status + share row */}
                  <div className="flex items-center justify-between border-t pt-3 gap-3">
                    <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                      {families.map((family) => {
                        const familyVote = getFamilyVote(d.votes, family.id);
                        const votedOption = familyVote
                          ? d.options.find((o) => o.id === familyVote.option_id)
                          : null;

                        return (
                          <div
                            key={family.id}
                            className={`
                              inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs
                              ${
                                familyVote
                                  ? "bg-green-100 text-green-800"
                                  : "bg-muted text-muted-foreground"
                              }
                            `}
                            title={votedOption ? `Voted: ${votedOption.title}` : "Hasn't voted yet"}
                          >
                            {familyVote ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <span className="text-xs">{"\u23F3"}</span>
                            )}
                            {family.name}
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5 text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300"
                      onClick={() => handleShareWhatsApp(d)}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Share on WhatsApp</span>
                      <span className="sm:hidden">WhatsApp</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      {/* Decided decisions */}
      {decidedDecisions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-1.5">
            <Check className="h-5 w-5 text-green-600" />
            Decided ({decidedDecisions.length})
          </h2>
          {decidedDecisions.map((d) => {
            const chosenOption = d.decision.decided_option_id
              ? d.options.find((o) => o.id === d.decision.decided_option_id)
              : getWinningOption(d);

            return (
              <Card key={d.decision.id} className="opacity-90">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight">
                        {d.decision.title}
                      </CardTitle>
                      {d.decision.description && (
                        <CardDescription className="mt-1 text-xs">
                          {d.decision.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Decided</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {chosenOption ? (
                    <div className="rounded-lg border-2 border-green-500 bg-green-50 p-3">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="font-semibold text-sm">
                          {chosenOption.title}
                        </span>
                        {chosenOption.cost_eur != null && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {"\u20AC"}{chosenOption.cost_eur.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {chosenOption.description && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          {chosenOption.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Decision was made but the chosen option is unclear.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      {/* Expired decisions */}
      {expiredDecisions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Expired ({expiredDecisions.length})
          </h2>
          {expiredDecisions.map((d) => (
            <Card key={d.decision.id} className="opacity-60">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight text-muted-foreground">
                    {d.decision.title}
                  </CardTitle>
                  <Badge variant="secondary">Expired</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  This decision expired without a result.
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}

// --- Family Selector Component ---

function FamilySelector({
  families,
  selectedFamilyId,
  onChange,
}: {
  families: Family[];
  selectedFamilyId: string;
  onChange: (familyId: string | null) => void;
}) {
  if (families.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        Voting as:
      </label>
      <Select value={selectedFamilyId} onValueChange={onChange}>
        <SelectTrigger className="w-full max-w-[220px]">
          <SelectValue placeholder="Select your family" />
        </SelectTrigger>
        <SelectContent>
          {families.map((family) => (
            <SelectItem key={family.id} value={family.id} label={family.name}>
              {family.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
