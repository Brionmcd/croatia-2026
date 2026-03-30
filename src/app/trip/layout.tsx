"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Vote,
  Wallet,
  Compass,
  Users,
  ChevronDown,
  ClipboardList,
  Check,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { FamilyProvider, useFamily } from "@/lib/family-context";

const ACCESS_CODE_KEY = "croatia2026_access_code";

const NAV_ITEMS = [
  { href: "/trip", label: "Home", icon: CalendarDays },
  { href: "/trip/decisions", label: "Decisions", icon: Vote },
  { href: "/trip/budget", label: "Budget", icon: Wallet },
  { href: "/trip/logistics", label: "Logistics", icon: Compass },
] as const;

function getCountdown(): string {
  const target = new Date("2026-07-18T00:00:00");
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Trip time!";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days}d`;
}

function FamilyBadge() {
  const { family, families, selectFamily, needsSelection } = useFamily();
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; right: number } | null>(null);

  if (families.length === 0) return null;

  function handleToggle(e: React.MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setRect({ top: r.bottom + 4, right: window.innerWidth - r.right });
    setOpen(!open);
  }

  return (
    <>
      <button
        onClick={handleToggle}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[32px] ${
          needsSelection
            ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
            : "bg-primary/10 text-primary hover:bg-primary/15"
        }`}
      >
        <Users className="h-3 w-3" />
        {family ? family.name : "Select Family"}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && rect && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[101] bg-white rounded-lg shadow-lg border border-border py-1 min-w-[160px]"
            style={{ top: rect.top, right: rect.right }}
          >
            {families.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  selectFamily(f.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  family?.id === f.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {f.name}
                {f.children > 0 && (
                  <span className="text-xs text-muted-foreground ml-1.5">
                    {f.adults}+{f.children}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function DigestButton() {
  const [state, setState] = useState<"idle" | "loading" | "copied" | "shared">("idle");

  async function handleDigest(mode: "copy" | "whatsapp") {
    setState("loading");
    try {
      const code = localStorage.getItem(ACCESS_CODE_KEY);
      if (!code) return;

      const res = await fetch(`/api/digest?code=${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error("Failed to generate digest");

      const { digest } = await res.json();

      if (mode === "whatsapp") {
        const encoded = encodeURIComponent(digest);
        window.open(`https://wa.me/?text=${encoded}`, "_blank");
        setState("shared");
      } else {
        await navigator.clipboard.writeText(digest);
        setState("copied");
      }

      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  }

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex flex-col gap-2">
      <button
        onClick={() => handleDigest("whatsapp")}
        disabled={state === "loading"}
        className="flex items-center gap-2 rounded-full bg-green-600 text-white px-4 py-3 text-sm font-medium shadow-lg shadow-green-600/25 hover:bg-green-700 transition-colors disabled:opacity-60"
        title="Share trip digest to WhatsApp"
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state === "shared" ? (
          <Check className="h-4 w-4" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {state === "shared" ? "Shared!" : "Share Digest"}
        </span>
      </button>
    </div>
  );
}

function TripLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(ACCESS_CODE_KEY);
    if (!stored) {
      router.replace("/");
      return;
    }
    setAuthorized(true);
    setCountdown(getCountdown());

    const interval = setInterval(() => {
      setCountdown(getCountdown());
    }, 60_000);

    return () => clearInterval(interval);
  }, [router]);

  if (!authorized) {
    return null;
  }

  function isActive(href: string) {
    if (href === "/trip") return pathname === "/trip";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Desktop top header */}
      <header className="hidden md:block border-b border-border/60 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-primary">
              Croatia 2026
            </span>
            <span className="text-xs text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-full font-medium">
              {countdown}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-0.5 mr-3">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
            <FamilyBadge />
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden border-b border-border/60 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-primary">
              Croatia 2026
            </span>
            <span className="text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full font-medium">
              {countdown}
            </span>
          </div>
          <FamilyBadge />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-6">{children}</div>
      </main>

      {/* Floating digest button */}
      <DigestButton />

      {/* Mobile bottom tab bar — 4 tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-white/95 backdrop-blur-md safe-area-pb">
        <div className="flex h-16 items-center justify-around px-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors min-w-[64px] min-h-[44px] ${
                isActive(href)
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive(href) ? "stroke-[2.5]" : "stroke-[1.5]"
                }`}
              />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function TripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FamilyProvider>
      <TripLayoutInner>{children}</TripLayoutInner>
    </FamilyProvider>
  );
}
