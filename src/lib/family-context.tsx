"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Family } from "@/types/database";
import { getTripByAccessCode, getFamilies } from "@/lib/api";

const FAMILY_KEY = "croatia2026_family_id";
const ACCESS_CODE_KEY = "croatia2026_access_code";

interface FamilyContextValue {
  /** Currently selected family, or null if none chosen yet */
  family: Family | null;
  /** All families for this trip */
  families: Family[];
  /** Select a family (persists to localStorage) */
  selectFamily: (familyId: string) => void;
  /** Whether the family picker should be shown (no family selected yet) */
  needsSelection: boolean;
  /** Trip ID for data queries */
  tripId: string | null;
  /** Loading state */
  loading: boolean;
}

const FamilyContext = createContext<FamilyContextValue>({
  family: null,
  families: [],
  selectFamily: () => {},
  needsSelection: true,
  tripId: null,
  loading: true,
});

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const code = localStorage.getItem(ACCESS_CODE_KEY);
      if (!code) {
        setLoading(false);
        return;
      }
      const trip = await getTripByAccessCode(code);
      if (!trip) {
        setLoading(false);
        return;
      }
      setTripId(trip.id);
      const fams = await getFamilies(trip.id);
      setFamilies(fams);

      // Restore saved selection
      const saved = localStorage.getItem(FAMILY_KEY);
      if (saved && fams.some((f) => f.id === saved)) {
        setSelectedId(saved);
      }
      setLoading(false);
    }
    load();
  }, []);

  const selectFamily = useCallback(
    (familyId: string) => {
      setSelectedId(familyId);
      localStorage.setItem(FAMILY_KEY, familyId);
    },
    []
  );

  const family = families.find((f) => f.id === selectedId) ?? null;
  const needsSelection = !loading && !family;

  return (
    <FamilyContext.Provider
      value={{ family, families, selectFamily, needsSelection, tripId, loading }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
