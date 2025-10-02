import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function RecapPanel({ sekolahId, kelasId, nisn }) {
  const [range, setRange] = useState({
    from: dayjs().subtract(6, "day").format("YYYY-MM-DD"),
    to: dayjs().format("YYYY-MM-DD"),
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [sekolahId, kelasId, nisn, range.from, range.to]);

  async function load() {
    if (!sekolahId || !kelasId || !nisn) return;
    setLoading(true);
    try {
      const ref = collection(db, "sekolahtng", sekolahId, "kelas", kelasId, "siswa", nisn, "prayer_logs");
      const qy = query(ref, where("date", ">=", range.from), where("date", "<=", range.to));
      const snap = await getDocs(qy);
      const data = snap.docs.map((d) => d.data());

      const byDate = {};
      for (const x of data) {
        const d = x.date;
        if (!byDate[d]) byDate[d] = { date: d, fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, qiyamul_lail: 0, fasting: 0 };
        ["fajr", "dhuhr", "asr", "maghrib", "isha", "qiyamul_lail", "fasting"].forEach((k) => {
          byDate[d][k] += x[k] ? 1 : 0;
        });
      }
      const arr = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
      setRows(arr);
    } finally {
      setLoading(false);
    }
  }

  const exportCSV = () => {
    const header = ["date", "fajr", "dhuhr", "asr", "maghrib", "isha", "qiyamul_lail", "fasting"];
    const lines = [header.join(",")].concat(
      rows.map((r) => [r.date, r.fajr, r.dhuhr, r.asr, r.maghrib, r.isha, r.qiyamul_lail, r.fasting].join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rekap_${nisn}_${range.from}_${range.to}.csv`;
    a.click();
  };

  return (
    <div>
      <h4>Rekap Ibadah</h4>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <label>Dari: <input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} /></label>
        <label>Sampai: <input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} /></label>
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      {loading ? (
        <div>Memuat…</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Tanggal</Th><Th>Subuh</Th><Th>Dzuhur</Th><Th>Ashar</Th><Th>Maghrib</Th><Th>Isya</Th><Th>Qiyamul</Th><Th>Puasa</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date}>
                  <Td>{r.date}</Td><Td>{r.fajr}</Td><Td>{r.dhuhr}</Td><Td>{r.asr}</Td><Td>{r.maghrib}</Td><Td>{r.isha}</Td><Td>{r.qiyamul_lail}</Td><Td>{r.fasting}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const Th = (p) => <th style={{ borderBottom: "1px solid #eee", textAlign: "left", padding: "6px 8px" }} {...p} />;
const Td = (p) => <td style={{ borderBottom: "1px solid #f2f2f2", padding: "6px 8px" }} {...p} />;
