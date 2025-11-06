"use client";

import { useCallback, useState } from "react";
import { CatalogSection } from "./components/CatalogSection";
import { AuditSection } from "./components/AuditSection";
import { SystemUsersSection } from "./components/SystemUsersSection";
import { FlashMessage } from "./components/FlashMessage";
import { useAuditLog } from "./components/useAuditLog";
import { buttonClass, type FlashMessage as FlashMessageType, type FlashKind } from "./components/shared";

type MainTab = "catalogos" | "auditoria" | "usuarios";

const MAIN_TABS: Array<{ key: MainTab; label: string }> = [
  { key: "catalogos", label: "Catalogos" },
  { key: "auditoria", label: "Auditoria" },
  { key: "usuarios", label: "Usuarios del sistema" },
];

export default function AdminPage() {
  const [mainTab, setMainTab] = useState<MainTab>("catalogos");
  const [flash, setFlash] = useState<FlashMessageType | null>(null);

  const notify = useCallback(
    (kind: FlashKind, text: string) => setFlash({ kind, text }),
    []
  );

  const { filtered: auditEntries, filter: auditFilter, setFilter: setAuditFilter, loading: loadingAudit, load: loadAudit } =
    useAuditLog(notify);

  const refreshAudit = useCallback(() => loadAudit(), [loadAudit]);
  const refreshAuditSilently = useCallback(() => loadAudit(true), [loadAudit]);

  return (
    <main className="min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Panel de administracion</h1>
            <p className="text-sm muted">
              Gestiona catalogos, auditoria y usuarios del software en un solo lugar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab.key}
                className={buttonClass(mainTab === tab.key ? "primary" : "outline", "sm")}
                onClick={() => setMainTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {flash && <FlashMessage flash={flash} onClose={() => setFlash(null)} />}

        {mainTab === "catalogos" && (
          <CatalogSection notify={notify} onCatalogMutated={refreshAuditSilently} />
        )}

        {mainTab === "auditoria" && (
          <AuditSection
            entries={auditEntries}
            filter={auditFilter}
            onFilterChange={setAuditFilter}
            loading={loadingAudit}
            onRefresh={refreshAudit}
          />
        )}

        {mainTab === "usuarios" && <SystemUsersSection notify={notify} />}
      </div>
    </main>
  );
}
