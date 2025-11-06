"use client";

import { buttonClass } from "./shared";

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const buttons: Array<number | "ellipsis"> = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      buttons.push(i);
    } else if ((i === page - 2 && page > 3) || (i === page + 2 && page < totalPages - 2)) {
      buttons.push("ellipsis");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1 pt-2">
      <button className={buttonClass("outline", "sm")} onClick={() => onChange(page - 1)} disabled={page === 1}>
        Anterior
      </button>
      {buttons.map((value, idx) =>
        value === "ellipsis" ? (
          <span key={`ellipsis-${idx}`} className="px-1 muted">
            ...
          </span>
        ) : (
          <button
            key={value}
            className={buttonClass(page === value ? "primary" : "outline", "sm")}
            onClick={() => onChange(value)}
            disabled={page === value}
          >
            {value}
          </button>
        )
      )}
      <button
        className={buttonClass("outline", "sm")}
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        Siguiente
      </button>
    </div>
  );
}
