"use client";

export type FlashKind = "ok" | "error";
export type FlashMessage = { kind: FlashKind; text: string };
export type NotifyFn = (kind: FlashKind, text: string) => void;

export const ITEMS_PER_PAGE = 8;

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

export function statusStyle(active: boolean) {
  return active
    ? { background: "color-mix(in oklab, var(--surface) 62%, #22c55e 38%)", color: "var(--fg)" }
    : { background: "color-mix(in oklab, var(--surface) 70%, var(--fg) 30%)", color: "var(--fg)" };
}

export function buttonClass(variant: "primary" | "outline" | "ghost", size: "sm" | "md" = "md") {
  if (variant === "primary") {
    return size === "sm" ? "btn btn-primary btn-sm" : "btn btn-primary";
  }
  return size === "sm" ? "btn btn-outline btn-sm" : "btn btn-outline";
}
