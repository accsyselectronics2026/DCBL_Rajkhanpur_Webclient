"use client";

import { useEffect, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";

type Row = Record<string, string | number | null>;

const LOADERS = [1, 2]; 
const today = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD

function nextDay(d: string) {
  const x = new Date(`${d}T00:00:00`);
  x.setDate(x.getDate() + 1);
  return x.toLocaleDateString("sv-SE");
}

function shiftRange(date: string, shift: string): [string, string] {
  if (shift === "A") return [`${date} 00:00:00`, `${date} 08:00:00`];
  if (shift === "B") return [`${date} 08:00:00`, `${date} 16:00:00`];
  return [`${date} 16:00:00`, `${nextDay(date)} 00:00:00`];
}

const input = "h-10 px-3 border border-gray-400 rounded-md bg-white text-gray-900";

const COLUMNS: Column<Row>[] = [
  { key: "CounterNo", header: "Loader No." },
  { key: "CustomerName", header: "Customer Name" },
  { key: "TruckNo", header: "Truck No." },
  { key: "ShipmentNo", header: "Shipment No" },
  { key: "Target", header: "Truck Set Point" },
  { key: "ActualCount", header: "Actual Count" },
  { key: "SKU", header: "SKU" },
  { key: "AddBags", header: "Add Bag" },
  { key: "DiffCount", header: "Difference" },
  { key: "StartTime", header: "Start Time" },
  { key: "EndTime", header: "End Time" },
];

export default function ReportsPage() {
  const [mode, setMode] = useState<"DateWise" | "ShiftWise">("DateWise");
  const [counters, setCounters] = useState(LOADERS.join(","));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [shift, setShift] = useState("A");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [range, setRange] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // today's date is read in the browser, after the page loads
  useEffect(() => {
    const t = today();
    setFrom(`${t}T00:00`);
    setTo(`${t}T23:59`);
    setShiftDate(t);
  }, []);

  async function load() {
    setError("");
    const [start, end] =
      mode === "DateWise"
        ? [from.replace("T", " ") + ":00", to.replace("T", " ") + ":00"]
        : shiftRange(shiftDate, shift);

    setLoading(true);
    try {
      const qs = new URLSearchParams({ from: start, to: end, counters });
      const res = await fetch(`/api/reports/loader?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? `Failed to load report (status ${res.status})`);
        return;
      }
      setRows(data.rows);
      setRange(`${start} to ${end}`);
    } catch {
      setError("Cannot reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 text-gray-900">
      <h1 className="text-2xl font-bold">Loader Report</h1>

      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="font-semibold">Loader</label>
          <select className={input} value={counters} onChange={(e) => setCounters(e.target.value)}>
            <option value={LOADERS.join(",")}>All Truck Loaders</option>
            {LOADERS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>

          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "DateWise"} onChange={() => setMode("DateWise")} /> Date wise
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "ShiftWise"} onChange={() => setMode("ShiftWise")} /> Shift wise
          </label>
        </div>

        {mode === "DateWise" ? (
          <div className="flex flex-wrap items-center gap-4">
            <label className="font-semibold">From</label>
            <input type="datetime-local" className={input} value={from} onChange={(e) => setFrom(e.target.value)} />
            <label className="font-semibold">To</label>
            <input type="datetime-local" className={input} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <label className="font-semibold">Date</label>
            <input type="date" className={input} value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} />
            {["A", "B", "C"].map((s) => (
              <label key={s} className="flex items-center gap-2">
                <input type="radio" checked={shift === s} onChange={() => setShift(s)} /> Shift {s}
              </label>
            ))}
          </div>
        )}

        <button
          type="button" onClick={load} disabled={loading}
          className="h-10 px-5 rounded-md bg-[#8E3FD6] text-white font-semibold disabled:opacity-60"
        >
          {loading ? "Loading..." : "View Report"}
        </button>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </section>

      {rows && (
        <DataTable
          title="Loader Report"
          subtitle={`DCBL, Raj Gangpur | ${range}`}
          columns={COLUMNS}
          rows={rows}
          rowKey={(r, i) => String(r.RECORD_ID ?? i)}
        />
      )}
    </div>
  );
}