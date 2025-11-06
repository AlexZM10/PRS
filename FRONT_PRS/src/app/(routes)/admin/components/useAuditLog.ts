"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGET } from "@/lib/api";
import type { AuditEntry } from "@/lib/types";
import type { NotifyFn } from "./shared";

const AUDIT_ENDPOINT = "/audit-log/";
const AUDIT_LIMIT = 20;

export type AuditFilter = "all" | "Empleado" | "RadioFrecuencia" | "SapUsuario";

export function useAuditLog(notify: NotifyFn) {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<AuditFilter>("all");

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const data = await apiGET<AuditEntry[]>(`${AUDIT_ENDPOINT}?limit=${AUDIT_LIMIT}`);
        setItems(data);
        return true;
      } catch (error) {
        if (!silent) {
          const message = error instanceof Error ? error.message : "No se pudo cargar la auditoria.";
          notify("error", message);
        }
        return false;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.aggregate === filter)),
    [filter, items]
  );

  return { items, filtered, filter, setFilter, loading, load };
}
