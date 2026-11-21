"use client";

import { useEffect, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";

type Row = Record<string, string | number | null>;

const LOADERS = [1, 2];
const today = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

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

// 24-hour time picker: value is "HH:MM"
function TimeField24({
  value, onChange, label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const [hh, mm] = value.split(":");
  return (
    <span className="inline-flex items-center gap-1">
      <select
        aria-label={`${label} hour`} className={input} value={hh}
        onChange={(e) => onChange(`${e.target.value}:${mm}`)}
      >
        {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <span aria-hidden>:</span>
      <select
        aria-label={`${label} minute`} className={input} value={mm}
        onChange={(e) => onChange(`${hh}:${e.target.value}`)}
      >
        {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </span>
  );
}

const COLUMNS: Column<Row>[] = [
  { key: "CounterNo", header: "Loader No." },
   { key: "TRIP_NO", header: "Wagon No" },
  { key: "TruckNo", header: "Box No" },
  { key: "Material", header: "Material" },
  { key: "DESTINATION", header: "Destination" },
  { key: "ActualCount", header: "Actual Count" },
  // { key: "SKU", header: "SKU" },
  { key: "AddBags", header: "Add Bag" },
  { key: "DiffCount", header: "Difference" },
  { key: "StartTime", header: "Start Time" },
  { key: "EndTime", header: "End Time" },
];

export default function ReportsPage() {
  const [mode, setMode] = useState<"DateWise" | "ShiftWise">("DateWise");
  const [counters, setCounters] = useState(LOADERS.join(","));
  const [fromDate, setFromDate] = useState("");
  const [fromTime, setFromTime] = useState("00:00");
  const [toDate, setToDate] = useState("");
  const [toTime, setToTime] = useState("23:59");
  const [shiftDate, setShiftDate] = useState("");
  const [shift, setShift] = useState("A");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [range, setRange] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // today's date is read in the browser, after the page loads
  useEffect(() => {
    const t = today();
    setFromDate(t);
    setToDate(t);
    setShiftDate(t);
  }, []);

  async function load() {
    setError("");
    const [start, end] =
      mode === "DateWise"
        ? [`${fromDate} ${fromTime}:00`, `${toDate} ${toTime}:59`]
        : shiftRange(shiftDate, shift);

    if (!start.trim() || !end.trim() || start.startsWith(" ") || end.startsWith(" ")) {
      setError("Please select the date.");
      return;
    }
    if (start > end) {
      setError("The 'To' date and time must be after the 'From' date and time.");
      return;
    }

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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <label className="font-semibold">From</label>
            <input
              type="date" className={input} value={fromDate} aria-label="From date"
              onChange={(e) => setFromDate(e.target.value)}
            />
            <TimeField24 label="From" value={fromTime} onChange={setFromTime} />

            <label className="font-semibold">To</label>
            <input
              type="date" className={input} value={toDate} aria-label="To date"
              onChange={(e) => setToDate(e.target.value)}
            />
            <TimeField24 label="To" value={toTime} onChange={setToTime} />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <label className="font-semibold">Date</label>
            <input
              type="date" className={input} value={shiftDate} aria-label="Shift date"
              onChange={(e) => setShiftDate(e.target.value)}
            />
            {["A", "B", "C"].map((s) => (
              <label key={s} className="flex items-center gap-2">
                <input type="radio" checked={shift === s} onChange={() => setShift(s)} /> Shift {s}
              </label>
            ))}
          </div>
        )}

        <button
          type="button" onClick={load} disabled={loading}
          className="h-10 px-5 rounded-md bg-[#68458a] text-white font-semibold disabled:opacity-60"
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