"use client";

import { buttonClass, type FlashMessage } from "./shared";

type FlashMessageProps = {
  flash: FlashMessage;
  onClose: () => void;
};

export function FlashMessage({ flash, onClose }: FlashMessageProps) {
  const palette =
    flash.kind === "ok"
      ? { background: "color-mix(in oklab, #22c55e 18%, var(--surface))", color: "#0b3219" }
      : { background: "color-mix(in oklab, #ef4444 20%, var(--surface))", color: "#451010" };

  return (
    <div className="card px-4 py-3 text-sm" style={palette}>
      <div className="flex items-start justify-between gap-4">
        <span>{flash.text}</span>
        <button className={`${buttonClass("outline", "sm")} uppercase tracking-wide`} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
