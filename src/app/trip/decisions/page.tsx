"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Vote, Check, Clock, Share2 } from "lucide-react";
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

export default function DecisionsPage() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [decisions, setDecisions] = useState<DecisionWithDetails[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [votingInProgress, setVotingInProgress] = useState<string | null>(null);
  const [copiedDecisionId, setCopiedDecisionId] = useState<string | null>(null);

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

  function handleShare(d: DecisionWithDetails) {
    const optionsList = d.options
      .map((o) => `  - ${o.title}${o.cost_eur ? ` (${o.cost_eur} EUR)` : ""}`)
      .join("\n");
    const url = typeof window !== "undefined" ? window.location.origin + "/trip/decisions" : "";
    const text = `\u{1F5F3}\uFE0F Vote needed: ${d.decision.title}\n\nOptions:\n${optionsList}\n\nVote at: ${url}`;

    // Try native share first (mobile), fall back to clipboard
    if (navigator.share) {
      navigator.share({ text }).catch(() => {
        copyToClipboard(text, d.decision.id);
      });
    } else {
      copyToClipboard(text, d.decision.id);
    }
  }

  function copyToClipboard(text: string, decisionId: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDecisionId(decisionId);
      setTimeout(() => setCopiedDecisionId(null), 2000);
    });
  }

  // Helpers
  function getFamilyName(familyId: string): string {
    return families.find((f) => f.id === familyId)?.name ?? "Unknown";
  }

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
    // If all families voted, find the option with the most votes
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

  function statusBadge(status: Decision["status"]) {
    switch (status) {
      case "open":
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Open</Badge>;
      case "decided":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Decided</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
    }
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
          Vote on group decisions. Tap an option to cast your vote.
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
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Select your family above to vote on decisions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Open decisions */}
      {openDecisions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Open Votes ({openDecisions.length})
          </h2>
          {openDecisions.map((d) => {
            const myVote = getMyVote(d.votes);
            const allVoted = d.votes.length >= families.length && families.length > 0;
            const winner = allVoted ? getWinningOption(d) : null;
            const deadline = formatDeadline(d.decision.deadline);

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
                    <div className="flex items-center gap-2 shrink-0">
                      {statusBadge(d.decision.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleShare(d)}
                        title="Share to WhatsApp"
                      >
                        {copiedDecisionId === d.decision.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {deadline && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {deadline}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* All voted result */}
                  {allVoted && winner && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-1.5">
                        <Check className="h-4 w-4" />
                        All families voted! Winner: {winner.title}
                      </p>
                    </div>
                  )}

                  {/* Options grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {d.options.map((option) => {
                      const isMyVote = myVote?.option_id === option.id;
                      const voteCount = getVoteCountForOption(d.votes, option.id);
                      const isWinner = winner?.id === option.id;
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
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-500/30"
                                : isWinner
                                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                : "border-border hover:border-primary/40 hover:bg-accent/50"
                            }
                            ${!selectedFamilyId ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                            ${isVoting ? "animate-pulse" : ""}
                          `}
                        >
                          {/* Selected indicator */}
                          {isMyVote && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-blue-500 text-white rounded-full p-0.5">
                                <Check className="h-3 w-3" />
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="font-semibold text-sm pr-6">
                              {option.title}
                            </div>

                            {option.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {option.description}
                              </p>
                            )}

                            {option.cost_eur != null && (
                              <p className="text-sm font-medium">
                                {option.cost_eur.toLocaleString()} EUR
                              </p>
                            )}

                            {option.pros && (
                              <p className="text-xs text-green-700 dark:text-green-400">
                                + {option.pros}
                              </p>
                            )}

                            {option.cons && (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                - {option.cons}
                              </p>
                            )}

                            {voteCount > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {voteCount} vote{voteCount !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Vote status: who voted */}
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Vote Status
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {families.map((family) => {
                        const familyVote = getFamilyVote(d.votes, family.id);
                        const votedOption = familyVote
                          ? d.options.find((o) => o.id === familyVote.option_id)
                          : null;

                        return (
                          <div
                            key={family.id}
                            className={`
                              inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs
                              ${
                                familyVote
                                  ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
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
                    {statusBadge(d.decision.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {chosenOption ? (
                    <div className="rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950/20 p-3">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="font-semibold text-sm">
                          {chosenOption.title}
                        </span>
                        {chosenOption.cost_eur != null && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {chosenOption.cost_eur.toLocaleString()} EUR
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
                  {statusBadge(d.decision.status)}
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
