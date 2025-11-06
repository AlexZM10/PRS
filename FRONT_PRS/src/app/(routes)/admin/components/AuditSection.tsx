"use client";

import { useMemo } from "react";
import { buttonClass, formatDate } from "./shared";
import type { AuditEntry } from "@/lib/types";
import type { AuditFilter } from "./useAuditLog";

const AUDIT_FILTER_OPTIONS: Array<{ value: AuditFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "Empleado", label: "Empleados" },
  { value: "RadioFrecuencia", label: "Radios" },
  { value: "SapUsuario", label: "Usuarios SAP" },
];

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Creado",
  UPDATED: "Actualizado",
  DELETED: "Eliminado",
};

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CREATED: { bg: "color-mix(in oklab, var(--surface) 60%, #22c55e 40%)", color: "var(--fg)" },
  UPDATED: { bg: "color-mix(in oklab, var(--surface) 60%, #f59e0b 40%)", color: "var(--fg)" },
  DELETED: { bg: "color-mix(in oklab, var(--surface) 55%, #ef4444 45%)", color: "var(--fg)" },
};

const AGGREGATE_LABELS: Record<string, string> = {
  Empleado: "Empleado",
  RadioFrecuencia: "Radio",
  SapUsuario: "Usuario SAP",
};

type AuditSectionProps = {
  entries: AuditEntry[];
  filter: AuditFilter;
  onFilterChange: (filter: AuditFilter) => void;
  loading: boolean;
  onRefresh: () => Promise<boolean>;
};

export function AuditSection({ entries, filter, onFilterChange, loading, onRefresh }: AuditSectionProps) {
  const hasEntries = entries.length > 0;

  return (
    <section className="card p-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Registro de auditoria</h2>
          <p className="text-sm muted">Consulta los ultimos cambios en los catalogos.</p>
        </div>
        <div className="flex gap-2">
          <select
            className="input"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as AuditFilter)}
          >
            {AUDIT_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className={buttonClass("outline", "sm")} disabled={loading} onClick={() => void onRefresh()}>
            Refrescar
          </button>
        </div>
      </div>
      {loading && (
        <p className="text-sm muted" data-testid="audit-loading">
          Cargando registros de auditoria...
        </p>
      )}
      {!loading && !hasEntries && <p className="text-sm muted">Sin registros para mostrar.</p>}
      <div className="space-y-3">
        {entries.map((entry) => (
          <AuditItem key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function AuditItem({ entry }: { entry: AuditEntry }) {
  const actionLabel = ACTION_LABELS[entry.action] ?? entry.action;
  const palette = ACTION_COLORS[entry.action] ?? {
    bg: "color-mix(in oklab, var(--ring) 20%, transparent)",
    color: "var(--fg)",
  };
  const aggregateLabel = AGGREGATE_LABELS[entry.aggregate] ?? entry.aggregate;
  const actorName = (entry as unknown as { actor_username?: string | null }).actor_username ?? null;

  const summary = useMemo(
    () =>
      diffSummary(
        (entry.before ?? null) as Record<string, unknown> | null,
        (entry.after ?? null) as Record<string, unknown> | null,
        entry.action
      ),
    [entry]
  );

  return (
    <article className="card space-y-2 text-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: palette.bg, color: palette.color }}
          >
            {actionLabel}
          </span>
          <span className="font-medium">{aggregateLabel}</span>
        </div>
        <time className="text-xs muted">{formatDate(entry.at)}</time>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs muted">
        <span className="font-mono">{entry.id_ref}</span>
        <span>|</span>
        <span>Usuario #{entry.actor_user_id}</span>
        {actorName && (
          <>
            <span>|</span>
            <span className="font-medium">{actorName}</span>
          </>
        )}
      </div>
      <p className="text-sm muted">{summary || "Sin detalles adicionales."}</p>
      {entry.reason && <p className="text-xs italic muted">Motivo: {entry.reason}</p>}
    </article>
  );
}

function diffSummary(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  action: string
) {
  if (action === "CREATED" && after) {
    return listEntries(after);
  }
  if (action === "DELETED" && before) {
    return listEntries(before);
  }
  if (!before || !after) return "";

  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  const lines: string[] = [];
  for (const key of keys) {
    const prev = JSON.stringify(before[key]);
    const next = JSON.stringify(after[key]);
    if (prev !== next) {
      lines.push(`${key}: ${valueToText(before[key])} -> ${valueToText(after[key])}`);
    }
  }
  return lines.join(", ");
}

function listEntries(source: Record<string, unknown>) {
  return Object.entries(source)
    .map(([key, value]) => `${key}: ${valueToText(value)}`)
    .join(", ");
}

function valueToText(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "number") return `${value}`;
  if (typeof value === "string") return value.trim() === "" ? "-" : value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
