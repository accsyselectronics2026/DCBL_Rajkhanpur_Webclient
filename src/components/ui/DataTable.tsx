"use client";

import { useMemo, useState } from "react";
import { exportExcel, exportPdf } from "@/lib/exportTable";

type Cell = string | number | null | undefined;

export type Column<T> = {
  key: string;
  header: string;
  value?: (row: T) => Cell; // defaults to row[key]
  hidden?: boolean;         // start hidden
  sortable?: boolean;       // default true
};

type Props<T> = {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  rowActions?: (row: T) => React.ReactNode; // optional "Task" column
  pageSizes?: number[];
};

function getCell<T extends Record<string, unknown>>(row: T, c: Column<T>): Cell {
  return c.value ? c.value(row) : (row[c.key] as Cell);
}

function compare(a: Cell, b: Cell) {
  const x = a ?? "";
  const y = b ?? "";
  const nx = Number(x);
  const ny = Number(y);
  if (x !== "" && y !== "" && !isNaN(nx) && !isNaN(ny)) return nx - ny;
  return String(x).localeCompare(String(y), undefined, { numeric: true });
}

const ctl = "h-9 px-3 rounded-md border border-gray-400 bg-white text-gray-900 text-sm";

export default function DataTable<T extends Record<string, unknown>>({
  title, subtitle, columns, rows, rowKey, rowActions, pageSizes = [10, 25, 50, 100],
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(pageSizes[0]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(columns.filter((c) => c.hidden).map((c) => c.key))
  );

  const visible = columns.filter((c) => !hidden.has(c.key));

  const processed = useMemo(() => {
    const vis = columns.filter((c) => !hidden.has(c.key));
    const q = search.trim().toLowerCase();
    let out = q
      ? rows.filter((r) => vis.some((c) => String(getCell(r, c) ?? "").toLowerCase().includes(q)))
      : rows;
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        const sign = sort.dir === "asc" ? 1 : -1;
        out = [...out].sort((a, b) => sign * compare(getCell(a, col), getCell(b, col)));
      }
    }
    return out;
  }, [rows, columns, hidden, search, sort]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const pageRows = processed.slice(start, start + pageSize);

  function toggleSort(key: string) {
    setSort((s) =>
      !s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null
    );
  }

  function toggleColumn(key: string) {
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }

  async function doExport(kind: "excel" | "pdf") {
    const headers = ["S.No.", ...visible.map((c) => c.header)];
    const body = processed.map((r, i) => [i + 1, ...visible.map((c) => getCell(r, c) ?? "")]);
    const fileName = `${title.replace(/\s+/g, "_")}_${new Date().toLocaleDateString("sv-SE")}`;
    const input = { title, subtitle, headers, body, fileName };
    if (kind === "excel") await exportExcel(input);
    else await exportPdf(input);
  }

  const colSpan = visible.length + 1 + (rowActions ? 1 : 0);

  return (
    <section className="bg-white text-gray-900 rounded-lg shadow">
      <div className="bg-[#68458a] text-white font-semibold px-4 py-3 rounded-t-lg">{title}</div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <label className="flex items-center gap-2 text-sm">
          Show
          <select
            className={ctl} value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {pageSizes.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          entries
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search" placeholder="Search" aria-label="Search" className={ctl}
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <details className="relative">
            <summary className={`${ctl} flex items-center cursor-pointer list-none`}>Columns</summary>
            <div className="absolute right-0 z-10 mt-1 w-56 max-h-72 overflow-auto rounded-md border border-gray-300 bg-white p-2 shadow">
              {columns.map((c) => (
                <label key={c.key} className="flex items-center gap-2 py-1 text-sm">
                  <input type="checkbox" checked={!hidden.has(c.key)} onChange={() => toggleColumn(c.key)} />
                  {c.header}
                </label>
              ))}
            </div>
          </details>
          <button type="button" className={ctl} onClick={() => doExport("excel")}>Excel</button>
          <button type="button" className={ctl} onClick={() => doExport("pdf")}>PDF</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              {rowActions && <th className="px-4 py-3">Task</th>}
              <th className="px-4 py-3">S.No.</th>
              {visible.map((c) => (
                <th key={c.key} className="px-4 py-3 whitespace-nowrap">
                  {c.sortable === false ? (
                    c.header
                  ) : (
                    <button type="button" onClick={() => toggleSort(c.key)} className="font-semibold">
                      {c.header}{" "}
                      <span aria-hidden>
                        {sort?.key === c.key ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-6 text-center text-gray-600">
                  No records found.
                </td>
              </tr>
            )}
            {pageRows.map((r, i) => (
              <tr key={rowKey(r, start + i)} className="border-t border-gray-200">
                {rowActions && <td className="px-4 py-3">{rowActions(r)}</td>}
                <td className="px-4 py-3">{start + i + 1}</td>
                {visible.map((c) => (
                  <td key={c.key} className="px-4 py-3 whitespace-nowrap">{getCell(r, c) ?? ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
        <span>
          Showing {processed.length === 0 ? 0 : start + 1} to{" "}
          {Math.min(start + pageSize, processed.length)} of {processed.length} entries
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button" className={`${ctl} disabled:opacity-50`}
            disabled={current === 1} onClick={() => setPage(current - 1)}
          >
            Previous
          </button>
          <label className="flex items-center gap-2">
            Page
            <select className={ctl} value={current} onChange={(e) => setPage(Number(e.target.value))}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            of {totalPages}
          </label>
          <button
            type="button" className={`${ctl} disabled:opacity-50`}
            disabled={current === totalPages} onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}