"use client";

import { useState, useEffect, useCallback } from "react";

const EUR_TO_USD = 1.08;
const STORAGE_KEY = "croatia2026_currency";

export type Currency = "EUR" | "USD";

export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>("EUR");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "USD") setCurrencyState("USD");
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  }, []);

  const toggle = useCallback(() => {
    setCurrency(currency === "EUR" ? "USD" : "EUR");
  }, [currency, setCurrency]);

  const convert = useCallback(
    (eur: number) => (currency === "USD" ? eur * EUR_TO_USD : eur),
    [currency]
  );

  const format = useCallback(
    (eur: number) => {
      const symbol = currency === "USD" ? "$" : "\u20AC";
      const value = convert(eur);
      return `${symbol}${value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    },
    [currency, convert]
  );

  return { currency, setCurrency, toggle, convert, format };
}
