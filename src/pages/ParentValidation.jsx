import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

// helper jam
const fmtHM = (v) => {
  if (!v) return "";
  try {
    if (typeof v?.toDate === "function") v = v.toDate();
    const d = v instanceof Date ? v : new Date(v);
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  } catch { return ""; }
};

export default function ParentValidation({ user }) {
  const [ptr, setPtr] = useState({ npsn: "", kelasId: "", nisn: "", childName: "" });
  const [days, setDays] = useState([]);              // daftar tanggal (7 hari)
  const [rows, setRows] = useState([]);              // data prayer_logs per hari
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // ambil anak yang ditautkan ke akun ortu (skenario: single child dengan field childNisn/childKelasId/childNpsn
  // kalau project kamu simpan array 'children', ambil entry pertama sebagai default)
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const u = (await getDoc(doc(db, "users", user.uid))).data() || {};
      let npsn = u.childNpsn || u.npsn || u.sekolahId || "";
      let kelasId = u.childKelasId || u.kelasId || u.idKelas || "";
      let nisn = u.childNisn || u.nisn || "";
      // jika punya array children, pilih pertama
      if (!nisn && Array.isArray(u.children) && u.children.length) {
        const c = u.children[0];
        npsn = c.npsn || npsn;
        kelasId = c.kelasId || kelasId;
        nisn = c.nisn || nisn;
      }
      // ambil nama siswa
      let childName = "";
      if (npsn && kelasId && nisn) {
        const s = await getDoc(doc(db, "sekolahtng", npsn, "kelas", kelasId, "siswa", nisn));
        childName = s.data()?.nama || "";
      }
      setPtr({ npsn, kelasId, nisn, childName });
    })();
  }, [user?.uid]);

  // tanggal 7 hari ke belakang
  useEffect(() => {
    const list = [...Array(7)].map((_, i) => dayjs().subtract(i, "day").format("YYYY-MM-DD")).reverse();
    setDays(list);
  }, []);

  // load rekap 7 hari
  useEffect(() => {
    (async () => {
      if (!ptr.npsn || !ptr.kelasId || !ptr.nisn || days.length === 0) return;
      setLoading(true);
      const out = [];
      for (const d of days) {
        const snap = await getDoc(doc(db, "sekolahtng", ptr.npsn, "kelas", ptr.kelasId, "siswa", ptr.nisn, "prayer_logs", d));
        const v = snap.data() || {};
        out.push({ dateId: d, ...v });
      }
      setRows(out);
      setLoading(false);
    })();
  }, [ptr.npsn, ptr.kelasId, ptr.nisn, days]);

  const act = async (dateId, approve) => {
    try {
      setMsg("");
      const ref = doc(db, "sekolahtng", ptr.npsn, "kelas", ptr.kelasId, "siswa", ptr.nisn, "prayer_logs", dateId);
      await setDoc(ref, {
        parentValidation: {
          status: approve ? "approved" : "rejected",
          byUid: user.uid,
          byName: user.displayName || "",
          at: new Date()
        }
      }, { merge: true });
      setRows((rs) => rs.map(r => r.dateId === dateId ? {
        ...r,
        parentValidation: {
          status: approve ? "approved" : "rejected",
          byUid: user.uid,
          byName: user.displayName || "",
          at: new Date()
        }
      } : r));
      setMsg("Status validasi tersimpan.");
    } catch (e) {
      console.error(e);
      setMsg("Gagal menyimpan validasi.");
    }
  };

  const checks = ["fajr","dhuhr","asr","maghrib","isha","qiyamul_lail","fasting"];
  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
          <h2 className="text-lg font-semibold">Validasi Ibadah Anak</h2>
          <p className="text-sm opacity-90">{ptr.childName || "—"} • NISN {ptr.nisn || "—"}</p>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.dateId} className="rounded-xl border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {dayjs(r.dateId).format("dddd, DD MMMM YYYY")}
                    </div>
                    <div className="text-xs">
                      {r.parentValidation?.status ? (
                        <span className={`rounded-full px-2 py-0.5 ${r.parentValidation.status === "approved" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"}`}>
                          {r.parentValidation.status}
                        </span>
                      ) : (
                        <span className="text-slate-500">Belum divalidasi</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {checks.map((k) => (
                      <div key={k} className="flex items-center justify-between rounded border p-2 text-sm">
                        <span className="capitalize">
                          {k==="fajr"?"Subuh":k==="dhuhr"?"Dzuhur":k==="asr"?"Ashar":k==="maghrib"?"Maghrib":k==="isha"?"Isya":k==="qiyamul_lail"?"Qiyamul Lail":"Puasa"}
                        </span>
                        <span className="text-right">
                          <div>{r[k] ? "✅" : "—"}</div>
                          <div className="text-[10px] text-slate-500">{r[`${k}_at`] ? fmtHM(r[`${k}_at`]) : ""}</div>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => act(r.dateId, true)} className="btn-primary">Approve</button>
                    <button onClick={() => act(r.dateId, false)} className="btn-ghost">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {msg && <div className="mt-3 text-sm text-emerald-700">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
