"use client";

import { useCallback, useState } from "react";
import type { NotifyFn } from "./shared";

export function useBusyMutation(notify: NotifyFn) {
  const [busy, setBusy] = useState(false);

  const runMutation = useCallback(
    async (fn: () => Promise<void>, success?: string) => {
      setBusy(true);
      try {
        await fn();
        if (success) notify("ok", success);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Ocurrio un error inesperado.";
        notify("error", message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [notify]
  );

  return { busy, runMutation };
}
