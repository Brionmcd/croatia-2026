"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getTripByAccessCode } from "@/lib/api";

const ACCESS_CODE_KEY = "croatia2026_access_code";

export default function AccessPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(ACCESS_CODE_KEY);
    if (stored) {
      getTripByAccessCode(stored).then((trip) => {
        if (trip) {
          router.replace("/trip");
        } else {
          localStorage.removeItem(ACCESS_CODE_KEY);
        }
      });
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length === 0) return;

    setLoading(true);
    setError("");

    const trip = await getTripByAccessCode(trimmed);
    if (trip) {
      localStorage.setItem(ACCESS_CODE_KEY, trimmed);
      router.push("/trip");
    } else {
      setError("Invalid access code. Check your family group chat.");
      setLoading(false);
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-primary/5 via-background to-secondary/20 px-4">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-accent/[0.04] blur-3xl" />
      </div>

      {/* Subtle wave decoration */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          className="w-full text-primary/[0.06]"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,64 C360,120 720,0 1080,64 C1260,96 1380,80 1440,64 L1440,120 L0,120 Z"
          />
        </svg>
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        {/* Title */}
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          Croatia 2026
        </h1>
        <p className="mb-1 text-base text-accent font-medium">
          Family Trip Planning Hub
        </p>
        <p className="mb-10 text-sm text-muted-foreground">
          Split &middot; Hvar &middot; Korcula &middot; Dubrovnik
        </p>

        {/* Access code form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="access-code"
              className="text-sm font-medium text-muted-foreground"
            >
              Enter your family access code
            </label>
            <Input
              id="access-code"
              type="text"
              placeholder="Access code"
              maxLength={20}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-12 text-center text-lg font-mono tracking-[0.2em] uppercase bg-white/80 backdrop-blur-sm border-border focus:border-primary"
              autoComplete="off"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
          <Button
            type="submit"
            disabled={code.trim().length === 0 || loading}
            className="h-12 w-full text-base font-semibold shadow-md shadow-primary/15 transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            {loading ? "Checking..." : "Enter"}
          </Button>
        </form>

        <p className="mt-8 text-xs text-muted-foreground/70">
          Check your family group chat for the code
        </p>
      </div>
    </div>
  );
}
