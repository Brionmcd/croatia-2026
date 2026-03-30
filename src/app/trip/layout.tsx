"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Vote,
  Wallet,
  Compass,
  MessageCircleQuestion,
} from "lucide-react";

const ACCESS_CODE_KEY = "croatia2026_access_code";

const NAV_ITEMS = [
  { href: "/trip", label: "Itinerary", icon: CalendarDays },
  { href: "/trip/decisions", label: "Decisions", icon: Vote },
  { href: "/trip/budget", label: "Budget", icon: Wallet },
  { href: "/trip/logistics", label: "Logistics", icon: Compass },
  { href: "/trip/questions", label: "Questions", icon: MessageCircleQuestion },
] as const;

function getCountdown(): string {
  const target = new Date("2026-07-18T00:00:00");
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Trip time!";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days} days to go`;
}

export default function TripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <header className="hidden md:block border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-primary">
              Croatia 2026
            </span>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {countdown}
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-12 items-center justify-between px-4">
          <span className="text-base font-bold text-primary">
            Croatia 2026
          </span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {countdown}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-4">{children}</div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-md safe-area-pb">
        <div className="flex h-16 items-center justify-around px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors min-w-[56px] ${
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
