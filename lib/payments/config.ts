/**
 * Shared payment config + helpers (safe for client + server).
 */

export const DEFAULT_CURRENCY = "USD";

export const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "AED", "SAR", "CAD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PAYMENT_ITEM_TYPES = [
  { value: "service", label: "Service" },
  { value: "project", label: "Project" },
  { value: "deposit", label: "Deposit / Advance" },
  { value: "custom", label: "Custom" },
] as const;

export const PAYMENT_ITEM_TYPE_VALUES = [
  "service",
  "project",
  "deposit",
  "custom",
] as const;
export type PaymentItemType = (typeof PAYMENT_ITEM_TYPE_VALUES)[number];

export const MIN_AMOUNT = 1;
export const MAX_AMOUNT = 100000;

/** Generate a short human-friendly internal order id, e.g. MT-A1B2C3D4 */
export function generateOrderId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `MT-${suffix}`;
}

/** Format an amount for a currency code with Intl (client & server safe). */
export function formatMoney(amount: number, currency = DEFAULT_CURRENCY): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

/** Parses a user-entered amount string → positive number, or null. */
export function parseAmount(input: string): number | null {
  const n = Number(String(input).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}
