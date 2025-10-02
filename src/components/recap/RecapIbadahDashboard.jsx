import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { db } from "../../firebase";
import {
  collection, collectionGroup, doc, getDoc, getDocs,
  orderBy, query, where,
} from "firebase/firestore";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
} from "recharts";

dayjs.extend(isoWeek);

/* ===== Tailwind presets (tanpa CSS tambahan) ===== */
/* ---------- Table Shell modern ---------- */
/* ===== Tailwind tokens (global, dipakai banyak komponen) ===== */
const CARD =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const HSEC = "mb-3 flex items-center justify-between";

const BTN = {
  primary:
    "inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
  ghost:
    "inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300",
};

/* ---------- Table Shell modern ---------- */
const TABLE_SHELL =
  "relative overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";
// header tetap sticky, tapi full-opaque + border jelas
const THEAD =
  "sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/70 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.08)]";
  

// tabel pakai border-collapse supaya garis per-sel menyatu rapi
const TBL_BASE = (dense) =>
  `w-full border-collapse ${dense ? "text-[13px] leading-5" : "text-sm"} text-slate-700 dark:text-slate-200`;

const ROW = "hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors";
const ROW_ZEBRA =
  "odd:bg-white even:bg-slate-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70";

/* Badge util untuk SeriesToggles */
const PILL = {
  base: "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
  active: "bg-slate-100",
};

/* (opsional) dipakai Th/Td lama jika masih ada */
const CLZ = {
  th: "border-b border-slate-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  td: "border-b border-slate-50 px-3 py-2 text-sm",
};

export function ModernTable({ dense=false, children }) {
  return <div className={TABLE_SHELL}>{children}</div>;
}

export function ThNew(props) {
  return (
    <th
      className="border border-slate-200 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide
                 text-slate-600 first:rounded-tl-2xl last:rounded-tr-2xl
                 dark:border-slate-700 dark:text-slate-300"
      {...props}
    />
  );
}

export function TdNew(props) {
  return (
    <td
      className="border border-slate-200 px-3 py-2 align-top text-slate-700
                 dark:border-slate-700 dark:text-slate-200"
      {...props}
    />
  );
}


/* ---------- Reusable UI smalls ---------- */
const PILL_BASE = "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium";
export const VerifyPill = ({ ok, labelOk="Terverifikasi", labelNo="Belum" }) => (
  <span className={`${PILL_BASE} ${ok
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-300"
      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"}`}>
    {ok ? labelOk : labelNo}
  </span>
);

export const Medal = ({ index }) => {
  const map = ["bg-amber-400", "bg-slate-300", "bg-orange-400"];
  if (index > 2) return null;
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${map[index]} mr-1`} />;
};

/* ===== Warna seri (hex utk Recharts) + util Tailwind utk toggle ===== */
const SERIES_MAP = {
  fajr:          { hex: "#10b981", dot: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-300", label: "Subuh" },
  dhuhr:         { hex: "#f59e0b", dot: "bg-amber-500",   text: "text-amber-700",   border: "border-amber-300",   label: "Dzuhur" },
  asr:           { hex: "#8b5cf6", dot: "bg-violet-500",  text: "text-violet-700",  border: "border-violet-300",  label: "Ashar" },
  maghrib:       { hex: "#ef4444", dot: "bg-red-500",     text: "text-red-700",     border: "border-red-300",     label: "Maghrib" },
  isha:          { hex: "#3b82f6", dot: "bg-blue-500",    text: "text-blue-700",    border: "border-blue-300",    label: "Isya" },
  qiyamul_lail:  { hex: "#06b6d4", dot: "bg-cyan-500",    text: "text-cyan-700",    border: "border-cyan-300",    label: "Qiyamul" },
  fasting:       { hex: "#eab308", dot: "bg-yellow-500",  text: "text-yellow-700",  border: "border-yellow-300",  label: "Puasa" },
  total5x:       { hex: "#64748b", dot: "bg-slate-500",   text: "text-slate-700",   border: "border-slate-300",   label: "Total 5x" },
};
const KEYS5 = ["fajr","dhuhr","asr","maghrib","isha"];
const EXTRA = ["qiyamul_lail","fasting"];

export default function RecapIbadahDashboard({ sekolahId, kelasId, nisn }) {
  const [scope, setScope] = useState(() => (nisn ? "individu" : kelasId ? "kelas" : "sekolah"));
  const today = dayjs();
  const [range, setRange] = useState({ from: today.subtract(29, "day").format("YYYY-MM-DD"), to: today.format("YYYY-MM-DD") });
  const [granularity, setGranularity] = useState("harian");
  const [loading, setLoading] = useState(false);

  const [rows, setRows] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [detailRows, setDetailRows] = useState([]);
  

  // state untuk filter/sort di ranking
const [rankQuery, setRankQuery] = useState("");
const [rankSort, setRankSort] = useState("score");

// daftar yang ditampilkan (hasil filter+sort), tidak menimpa 'ranking' mentah
const filteredRanking = useMemo(() => {
  const kw = rankQuery.trim().toLowerCase();
  let arr = ranking;
  if (kw) {
    arr = arr.filter((x) =>
      [x.name, x.nisn, x.kelasId].filter(Boolean).some((v) => String(v).toLowerCase().includes(kw))
    );
  }
  // sort SALINAN agar tidak mutate state asal
  return [...arr].sort((a, b) => (b[rankSort] || 0) - (a[rankSort] || 0));
}, [ranking, rankQuery, rankSort]);


  const [visible, setVisible] = useState(() => {
    const v = {}; [...KEYS5, ...EXTRA, "total5x"].forEach(k => v[k]=true); return v;
  });

  useEffect(() => setScope(nisn ? "individu" : kelasId ? "kelas" : "sekolah"), [sekolahId, kelasId, nisn]);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [sekolahId, kelasId, nisn, range.from, range.to, granularity, scope]);

  async function load() {
    if (!sekolahId) return;
    setLoading(true);
    try {
      if (scope === "individu" && kelasId && nisn) {
        const logs = await fetchPrayerLogsByStudent(sekolahId, kelasId, nisn, range);
        const { aggregated, detailed, scoreSummary } = aggregateLogs(logs, granularity);
        setRows(aggregated);
        setDetailRows(detailed);
        setRanking([{ nisn, name: await fetchStudentName(sekolahId, kelasId, nisn), ...scoreSummary }]);
      } else if (scope === "kelas" && kelasId) {
        const { people, logsByStudent } = await fetchPrayerLogsByClass(sekolahId, kelasId, range);
        const { aggregated, scorePerPerson } = aggregateForGroup(logsByStudent, granularity);
        setRows(aggregated);
        setRanking(
          people.map(p => ({ nisn: p.nisn, name: p.name, ...(scorePerPerson[p.nisn] || emptyScore()) }))
                .sort((a,b)=>b.score-a.score)
        );
        setDetailRows([]);
      } else {
        const { classes, logsByStudent } = await fetchPrayerLogsBySchool(sekolahId, range);
        const { aggregated, scorePerPerson } = aggregateForGroup(logsByStudent, granularity);
        setRows(aggregated);
        const people = await listAllStudentsInSchool(sekolahId, classes);
        setRanking(
          people.map(p => ({ nisn: p.nisn, name: p.name, kelasId: p.kelasId, ...(scorePerPerson[p.nisn] || emptyScore()) }))
                .sort((a,b)=>b.score-a.score)
        );
        setDetailRows([]);
      }
    } finally { setLoading(false); }
  }

  const csvBlob = useMemo(() => buildCSV(rows), [rows]);

  return (
    <div className="space-y-4">
      <HeaderControls
        scope={scope} setScope={setScope}
        range={range} setRange={setRange}
        granularity={granularity} setGranularity={setGranularity}
        sekolahId={sekolahId} kelasId={kelasId} nisn={nisn}
        csvBlob={csvBlob}
      />

      {loading ? (
        <SkeletonChartGrid />
      ) : rows.length === 0 ? (
        <EmptyState onReset={()=>{
          const to = dayjs().format("YYYY-MM-DD");
          const from = dayjs().subtract(29,"day").format("YYYY-MM-DD");
          setRange({from,to}); setGranularity("harian");
        }}/>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Tren Ibadah"
              actions={<SeriesToggles keys={KEYS5} visible={visible} setVisible={setVisible} />}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {KEYS5.map(k => visible[k] && (
                    <Line key={k} type="monotone" dataKey={k} stroke={SERIES_MAP[k].hex} strokeWidth={2.4}
                          dot={{ r: 2 }} activeDot={{ r: 4 }} isAnimationActive />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Total Per Periode"
              actions={<SeriesToggles keys={["total5x", ...EXTRA]} visible={visible} setVisible={setVisible} />}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {visible["total5x"] && (
                    <Bar dataKey="total5x" stackId="a" fill={SERIES_MAP.total5x.hex} radius={[6,6,0,0]} />
                  )}
                  {EXTRA.map(k => visible[k] && (
                    <Bar key={k} dataKey={k} stackId="a" fill={SERIES_MAP[k].hex} radius={[6,6,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Detail Individu */}
          {scope === "individu" && (
          <TableCard title="Detail Harian (Individu)">
            <RankingToolbar
              q={rankQuery}
              setQ={setRankQuery}
              sortKey={rankSort}
              setSortKey={setRankSort}
/>
            <div className="overflow-x-auto">
              <table className={TBL_BASE(false)}>
                <thead className={THEAD}>
                  <tr>
                    <ThNew>Tanggal</ThNew><ThNew>Subuh</ThNew><ThNew>Dzuhur</ThNew><ThNew>Ashar</ThNew><ThNew>Maghrib</ThNew>
                    <ThNew>Isya</ThNew><ThNew>Qiyamul</ThNew><ThNew>Puasa</ThNew><ThNew>Verif Guru</ThNew><ThNew>Verif Wali</ThNew><ThNew>Catatan</ThNew>
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map(r => (
                    <tr key={r.date} className={`${ROW} ${ROW_ZEBRA}`}>
                      <TdNew>{r.date}</TdNew>
                      <TdNew>{r.fajr ? "✓" : "–"}</TdNew>
                      <TdNew>{r.dhuhr ? "✓" : "–"}</TdNew>
                      <TdNew>{r.asr ? "✓" : "–"}</TdNew>
                      <TdNew>{r.maghrib ? "✓" : "–"}</TdNew>
                      <TdNew>{r.isha ? "✓" : "–"}</TdNew>
                      <TdNew>{r.qiyamul_lail ? "✓" : "–"}</TdNew>
                      <TdNew>{r.fasting ? "✓" : "–"}</TdNew>
                      <TdNew><VerifyPill ok={r.verify_guru} /></TdNew>
                      <TdNew><VerifyPill ok={r.verify_walimurid} /></TdNew>
                      <TdNew className="max-w-[320px] truncate" title={r.notes || ""}>{r.notes || "-"}</TdNew>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard>
        )}


          {/* Ranking */}
          {(scope === "kelas" || scope === "sekolah") && (
  <TableCard title={`Ranking Kepatuhan Ibadah (${scope})`}>
  <RankingToolbar q={rankQuery} setQ={setRankQuery} sortKey={rankSort} setSortKey={setRankSort} />
  <div className="overflow-x-auto">
    <table className={TBL_BASE(false)}>
      <thead className={THEAD}>
        <tr>
          <ThNew>#</ThNew>
          <ThNew>NISN</ThNew>
          <ThNew>Nama</ThNew>
          {scope === "sekolah" && <ThNew>Kelas</ThNew>}
          <ThNew>Skor</ThNew>
          <ThNew>Subuh</ThNew>
          <ThNew>Dzuhur</ThNew>
          <ThNew>Ashar</ThNew>
          <ThNew>Maghrib</ThNew>
          <ThNew>Isya</ThNew>
          <ThNew>Qiyamul</ThNew>
          <ThNew>Puasa</ThNew>
        </tr>
      </thead>
      <tbody>
        {filteredRanking.map((r,i)=>(
          <tr key={r.nisn} className={`${ROW} ${ROW_ZEBRA}`}>
            <TdNew><div className="inline-flex items-center"><Medal index={i} />{i+1}</div></TdNew>
            <TdNew>{r.nisn}</TdNew>
            <TdNew className="font-medium">{r.name || "-"}</TdNew>
            {scope === "sekolah" && <TdNew>{r.kelasId || "-"}</TdNew>}
            <TdNew className="font-semibold">{r.score}</TdNew>
            <TdNew>{r.fajr}</TdNew><TdNew>{r.dhuhr}</TdNew><TdNew>{r.asr}</TdNew>
            <TdNew>{r.maghrib}</TdNew><TdNew>{r.isha}</TdNew><TdNew>{r.qiyamul_lail}</TdNew><TdNew>{r.fasting}</TdNew>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</TableCard>



          )}
          

          {/* Rekap tabel utama */}
          <TableCard title={`Rekap (${granularity})`}>
  <div className="overflow-x-auto">
    <table className={TBL_BASE(false)}>
      <thead className={THEAD}>
        <tr>
          <ThNew>Periode</ThNew><ThNew>Subuh</ThNew><ThNew>Dzuhur</ThNew><ThNew>Ashar</ThNew><ThNew>Maghrib</ThNew><ThNew>Isya</ThNew>
          <ThNew>Qiyamul</ThNew><ThNew>Puasa</ThNew><ThNew>Total 5x</ThNew>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.label} className={`${ROW} ${ROW_ZEBRA}`}>
            <TdNew className="font-medium">{r.label}</TdNew>
            <TdNew>{r.fajr}</TdNew><TdNew>{r.dhuhr}</TdNew><TdNew>{r.asr}</TdNew><TdNew>{r.maghrib}</TdNew><TdNew>{r.isha}</TdNew>
            <TdNew>{r.qiyamul_lail}</TdNew><TdNew>{r.fasting}</TdNew>
            <TdNew className="font-semibold">{r.total5x}</TdNew>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</TableCard>

        </>
      )}
    </div>
  );
}

/* ===== Header + Controls (pure Tailwind) ===== */
function HeaderControls({ scope, setScope, range, setRange, granularity, setGranularity, sekolahId, kelasId, nisn, csvBlob }) {
  const download = () => {
    if (!csvBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(csvBlob);
    a.download = `rekap_${scope}_${dayjs(range.from).format("YYYYMMDD")}_${dayjs(range.to).format("YYYYMMDD")}.csv`;
    a.click();
  };
  const setQuick = (days) => {
    const to = dayjs().format("YYYY-MM-DD");
    const from = dayjs().subtract(days - 1, "day").format("YYYY-MM-DD");
    setRange({ from, to });
  };
  const setSemester = () => {
    const d = dayjs();
    const start = d.month() < 6 ? d.startOf("year") : d.startOf("year").add(6, "month");
    const end = d.month() < 6 ? d.startOf("year").add(5, "month").endOf("month") : d.endOf("year");
    setRange({ from: start.format("YYYY-MM-DD"), to: end.format("YYYY-MM-DD") });
    setGranularity("semester");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm">
        <span className="text-sm text-slate-600">Scope:</span>
        <select className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                value={scope} onChange={(e)=>setScope(e.target.value)}>
          <option value="individu" disabled={!nisn}>Individu</option>
          <option value="kelas" disabled={!kelasId}>Kelas</option>
          <option value="sekolah">Sekolah</option>
        </select>
      </div>

      <label className="text-sm">
        Dari:{" "}
        <input type="date" value={range.from}
               onChange={(e)=>setRange(r=>({ ...r, from: e.target.value }))}
               className="rounded-md border border-slate-200 px-2 py-1" />
      </label>
      <label className="text-sm">
        Sampai:{" "}
        <input type="date" value={range.to}
               onChange={(e)=>setRange(r=>({ ...r, to: e.target.value }))}
               className="rounded-md border border-slate-200 px-2 py-1" />
      </label>

      <select className="rounded-md border border-slate-200 px-2 py-1 text-sm"
              value={granularity} onChange={(e)=>setGranularity(e.target.value)}>
        <option value="harian">Harian</option>
        <option value="mingguan">Mingguan</option>
        <option value="bulanan">Bulanan</option>
        <option value="semester">Semester</option>
      </select>

      <div className="ml-1 flex items-center gap-1">
        <button onClick={()=>setQuick(7)} className={BTN.ghost}>7H</button>
        <button onClick={()=>setQuick(30)} className={BTN.ghost}>30H</button>
        <button onClick={setSemester} className={BTN.ghost}>Semester</button>
      </div>

      <button onClick={download} className={`${BTN.primary} ml-auto`}>Download CSV</button>
    </div>
  );
}

function SeriesToggles({ keys, visible, setVisible }) {
  return (
    <div className="flex flex-wrap gap-1">
      {keys.map(k => {
        const m = SERIES_MAP[k];
        const on = !!visible[k];
        return (
          <button key={k}
                  onClick={()=>setVisible(s=>({ ...s, [k]: !s[k] }))}
                  className={`${PILL.base} ${on ? PILL.active : ""} ${m.border} ${m.text}`}>
            <span className={`mr-1 inline-block h-2 w-2 rounded-full ${m.dot}`} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

function TableCard({ title, children, dense=false }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
        {/* toggle densitas (opsional) */}
        <div className="hidden sm:flex items-center gap-1 text-xs">
          <span className="text-slate-500">Density</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            {/* kamu bisa angkat state 'dense' ke parent jika mau kontrol global */}
            {/* contoh statis: */}
            <button className={`px-2 py-0.5 rounded-md ${dense ? "text-slate-500" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"}`}>Cozy</button>
            <button className={`px-2 py-0.5 rounded-md ${dense ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100" : "text-slate-500"}`}>Compact</button>
          </div>
        </div>
      </div>

      <ModernTable dense={dense}>
        {children}
      </ModernTable>
    </div>
  );
}


function ChartCard({ title, actions, children }) {
  return (
    <div className={CARD}>
      <div className={HSEC}>
        <h4 className="text-base font-semibold">{title}</h4>
        {actions}
      </div>
      {children}
    </div>
  );
}

function RankingToolbar({ q, setQ, sortKey, setSortKey }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari nama/NISN/kelas…"
        className="rounded-md border border-slate-200 px-2 py-1 text-sm"
      />
      <select
        className="rounded-md border border-slate-200 px-2 py-1 text-sm"
        value={sortKey}
        onChange={(e) => setSortKey(e.target.value)}
      >
        <option value="score">Skor</option>
        <option value="fajr">Subuh</option>
        <option value="dhuhr">Dzuhur</option>
        <option value="asr">Ashar</option>
        <option value="maghrib">Maghrib</option>
        <option value="isha">Isya</option>
        <option value="qiyamul_lail">Qiyamul</option>
        <option value="fasting">Puasa</option>
      </select>
    </div>
  );
}




function SkeletonChartGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[0,1].map(i=>(
        <div key={i} className={CARD}>
          <div className="mb-3 h-5 w-40 animate-pulse rounded bg-slate-100" />
          <div className="h-[280px] w-full animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className={CARD + " text-center"}>
      <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-slate-100" />
      <h4 className="text-base font-semibold">Belum ada data pada rentang ini</h4>
      <p className="mt-1 text-sm text-slate-600">Coba ubah rentang tanggal atau tingkatkan granularitasnya.</p>
      <div className="mt-3 flex justify-center gap-2">
        <button className={BTN.ghost} onClick={onReset}>Reset Rentang</button>
      </div>
    </div>
  );
}



/* ================= Firestore helpers ================= */
async function fetchStudentName(sekolahId, kelasId, nisn) {
  try {
    const d = await getDoc(doc(db, "sekolahtng", sekolahId, "kelas", kelasId, "siswa", nisn));
    return d.exists() ? d.data().nama || d.data().name || "" : "";
  } catch { return ""; }
}

async function fetchPrayerLogsByStudent(sekolahId, kelasId, nisn, range) {
  const ref = collection(db,"sekolahtng",sekolahId,"kelas",kelasId,"siswa",nisn,"prayer_logs");
  const qy = query(ref, where("date", ">=", range.from), where("date", "<=", range.to), orderBy("date","asc"));
  const snap = await getDocs(qy); return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}
async function listStudentsInClass(sekolahId, kelasId) {
  const snap = await getDocs(collection(db,"sekolahtng",sekolahId,"kelas",kelasId,"siswa"));
  return snap.docs.map(d=>({ nisn:d.id, ...(d.data()||{}), kelasId }));
}
async function fetchPrayerLogsByClass(sekolahId, kelasId, range) {
  const people = await listStudentsInClass(sekolahId, kelasId);
  const logsByStudent = {};
  for (const p of people) logsByStudent[p.nisn] = await fetchPrayerLogsByStudent(sekolahId, kelasId, p.nisn, range);
  return { people, logsByStudent };
}
async function listClassesInSchool(sekolahId) {
  const snap = await getDocs(collection(db,"sekolahtng",sekolahId,"kelas"));
  return snap.docs.map(d=>({ kelasId:d.id, ...(d.data()||{}) }));
}
async function listAllStudentsInSchool(sekolahId, classes) {
  const all = []; for (const c of classes) all.push(...(await listStudentsInClass(sekolahId, c.kelasId))); return all;
}
async function fetchPrayerLogsBySchool(sekolahId, range) {
  try {
    const qy = query(collectionGroup(db,"prayer_logs"),
      where("sekolahId","==",sekolahId),
      where("date",">=",range.from),
      where("date","<=",range.to));
    const snap = await getDocs(qy);
    const logsByStudent = {};
    for (const d of snap.docs) {
      const x = { id:d.id, ...d.data() };
      const key = x.nisn || "unknown";
      if (!logsByStudent[key]) logsByStudent[key] = [];
      logsByStudent[key].push(x);
    }
    const classes = await listClassesInSchool(sekolahId);
    return { classes, logsByStudent };
  } catch {
    const classes = await listClassesInSchool(sekolahId);
    const logsByStudent = {};
    for (const c of classes) {
      const { people, logsByStudent: l } = await fetchPrayerLogsByClass(sekolahId, c.kelasId, range);
      for (const p of people) logsByStudent[p.nisn] = l[p.nisn] || [];
    }
    return { classes, logsByStudent };
  }
}

/* ================ Aggregators & CSV ================ */
function emptyScore(){ return { score:0, fajr:0, dhuhr:0, asr:0, maghrib:0, isha:0, qiyamul_lail:0, fasting:0 }; }

function aggregateLogs(logs, granularity) {
  const detailed = [...logs].sort((a,b)=>String(a.date).localeCompare(String(b.date))).map(x=>({
    date:x.date, fajr:!!x.fajr, dhuhr:!!x.dhuhr, asr:!!x.asr, maghrib:!!x.maghrib, isha:!!x.isha,
    qiyamul_lail:!!x.qiyamul_lail, fasting:!!x.fasting, verify_guru:!!x.verify_guru, verify_walimurid:!!x.verify_walimurid, notes:x.notes||"",
  }));
  const bucket = new Map();
  for (const x of logs) {
    const label = periodLabel(x.date, granularity);
    if (!bucket.has(label)) bucket.set(label,{label,fajr:0,dhuhr:0,asr:0,maghrib:0,isha:0,qiyamul_lail:0,fasting:0,total5x:0});
    const o = bucket.get(label);
    for (const k of KEYS5) if (x[k]) o[k] += 1;
    for (const k of EXTRA) if (x[k]) o[k] += 1;
    o.total5x = KEYS5.reduce((acc,k)=>acc+o[k],0);
  }
  const aggregated = [...bucket.values()].sort((a,b)=>a.label.localeCompare(b.label,undefined,{numeric:true}));
  const scoreSummary = sumScore(logs);
  return { aggregated, detailed, scoreSummary };
}
function aggregateForGroup(logsByStudent, granularity) {
  const bucket = new Map(); const scorePerPerson = {};
  for (const [nisn, logs] of Object.entries(logsByStudent)) {
    scorePerPerson[nisn] = sumScore(logs);
    for (const x of logs) {
      const label = periodLabel(x.date, granularity);
      if (!bucket.has(label)) bucket.set(label,{label,fajr:0,dhuhr:0,asr:0,maghrib:0,isha:0,qiyamul_lail:0,fasting:0,total5x:0});
      const o = bucket.get(label);
      for (const k of KEYS5) if (x[k]) o[k] += 1;
      for (const k of EXTRA) if (x[k]) o[k] += 1;
      o.total5x = KEYS5.reduce((acc,k)=>acc+o[k],0);
    }
  }
  const aggregated = [...bucket.values()].sort((a,b)=>a.label.localeCompare(b.label,undefined,{numeric:true}));
  return { aggregated, scorePerPerson };
}
function sumScore(logs){
  const s={fajr:0,dhuhr:0,asr:0,maghrib:0,isha:0,qiyamul_lail:0,fasting:0};
  for (const x of logs) for (const k of Object.keys(s)) if (x[k]) s[k]+=1;
  return { score: s.fajr+s.dhuhr+s.asr+s.maghrib+s.isha, ...s };
}
function periodLabel(dateStr, granularity){
  const d = dayjs(dateStr);
  if (granularity==="harian") return d.format("YYYY-MM-DD");
  if (granularity==="mingguan") return `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2,"0")}`;
  if (granularity==="bulanan") return d.format("YYYY-MM");
  if (granularity==="semester"){ const y=d.year(); const s=d.month()<6?1:2; return `${y}-S${s}`; }
  return d.format("YYYY-MM-DD");
}
function buildCSV(rows){
  if (!rows?.length) return null;
  const header=["Periode","Subuh","Dzuhur","Ashar","Maghrib","Isya","Qiyamul","Puasa","Total 5x"];
  const lines=[header.join(",")]; for (const r of rows) lines.push([r.label,r.fajr,r.dhuhr,r.asr,r.maghrib,r.isha,r.qiyamul_lail,r.fasting,r.total5x].join(","));
  return new Blob([lines.join("\n")],{type:"text/csv;charset=utf-8;"});
}
