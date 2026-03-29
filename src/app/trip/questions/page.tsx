"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  MessageCircleQuestion,
  Plus,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  getTripByAccessCode,
  getQuestions,
  getFamilies,
  addQuestion,
  updateQuestionStatus,
} from "@/lib/api";
import type { Question, Family } from "@/types/database";

const ACCESS_CODE_KEY = "croatia2026_access_code";

type QuestionStatus = "pending" | "asked" | "answered" | "resolved";

const STATUS_ORDER: QuestionStatus[] = ["pending", "asked", "answered", "resolved"];

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
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200",
    emoji: "⏳",
  },
  asked: {
    label: "Asked",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
    emoji: "📨",
  },
  answered: {
    label: "Answered",
    className: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200",
    emoji: "✅",
  },
  resolved: {
    label: "Resolved",
    className: "bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200",
    emoji: "✔️",
  },
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [tripId, setTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    const code = localStorage.getItem(ACCESS_CODE_KEY);
    if (!code) return;
    const trip = await getTripByAccessCode(code);
    if (!trip) return;
    setTripId(trip.id);
    const [q, f] = await Promise.all([getQuestions(trip.id), getFamilies(trip.id)]);
    setQuestions(q);
    setFamilies(f);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const familyMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const f of families) m[f.id] = f.name;
    return m;
  }, [families]);

  const grouped = useMemo(() => {
    const map: Record<QuestionStatus, Question[]> = {
      pending: [],
      asked: [],
      answered: [],
      resolved: [],
    };
    for (const q of questions) {
      const status = q.status as QuestionStatus;
      if (map[status]) map[status].push(q);
    }
    return map;
  }, [questions]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim() || !tripId) return;
    setSubmitting(true);
    const result = await addQuestion(tripId, newQuestion.trim());
    if (result) {
      setQuestions((prev) => [result, ...prev]);
      setNewQuestion("");
    }
    setSubmitting(false);
  }

  async function handleStatusCycle(question: Question) {
    const current = question.status as QuestionStatus;
    const next = STATUS_NEXT[current];

    // If cycling to "answered" and there's no answer yet, just update status
    const result = await updateQuestionStatus(question.id, next);
    if (result) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === result.id ? result : q))
      );
    }
  }

  function buildWhatsAppText(): string {
    const lines: string[] = ["Questions for Villa Escape:", ""];
    let num = 1;

    for (const status of STATUS_ORDER) {
      const items = grouped[status];
      if (items.length === 0) continue;

      for (const q of items) {
        const cfg = STATUS_CONFIG[status];
        lines.push(`${num}. ${cfg.emoji} ${q.question}`);
        if (q.answer) {
          lines.push(`   Answer: ${q.answer}`);
        }
        num++;
      }
    }
    return lines.join("\n");
  }

  async function handleCopyWhatsApp() {
    const text = buildWhatsAppText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MessageCircleQuestion className="h-12 w-12 text-primary/30 mb-4 animate-pulse" />
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Questions for Villa Escape
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyWhatsApp}
          className="gap-1.5"
          disabled={questions.length === 0}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied!" : "Copy for WhatsApp"}
        </Button>
      </div>

      {/* Add question form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="Type a new question..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              disabled={submitting}
              className="flex-1"
            />
            <Button type="submit" disabled={submitting || !newQuestion.trim()} size="default">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span className="ml-1.5 hidden sm:inline">Add</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Questions grouped by status */}
      {STATUS_ORDER.map((status) => {
        const items = grouped[status];
        if (items.length === 0) return null;
        const cfg = STATUS_CONFIG[status];

        return (
          <div key={status} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cfg.className}
              >
                {cfg.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {items.length} question{items.length !== 1 ? "s" : ""}
              </span>
            </div>

            {items.map((q) => (
              <Card key={q.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-sm font-medium leading-snug">
                        {q.question}
                      </p>

                      {q.answer && (
                        <div className="rounded-md bg-green-50 border border-green-100 p-3">
                          <p className="text-xs font-medium text-green-700 mb-0.5">
                            Answer
                          </p>
                          <p className="text-sm text-green-900">{q.answer}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {q.asked_by_family_id && familyMap[q.asked_by_family_id] && (
                          <span>Asked by {familyMap[q.asked_by_family_id]}</span>
                        )}
                        <span>{formatDate(q.created_at)}</span>
                        {q.resolved_at && (
                          <span>Resolved {formatDate(q.resolved_at)}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleStatusCycle(q)}
                      className="shrink-0"
                      title={`Click to change to "${STATUS_CONFIG[STATUS_NEXT[q.status as QuestionStatus]].label}"`}
                    >
                      <Badge
                        variant="secondary"
                        className={`cursor-pointer transition-colors ${STATUS_CONFIG[q.status as QuestionStatus].className}`}
                      >
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageCircleQuestion className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            No questions yet. Add one above!
          </p>
        </div>
      )}
    </div>
  );
}
