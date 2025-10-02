import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { useLocation, Link } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
import updateLocale from "dayjs/plugin/updateLocale";

// Locale Indonesia + "Ahad"
dayjs.extend(updateLocale);
dayjs.updateLocale("id", {
  weekdays: ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
  weekdaysShort: ["Ahd", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
  weekdaysMin: ["Ah", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"],
});
dayjs.locale("id");

export const fmtHM = (v) => {
  if (!v) return "";
  try {
    if (typeof v?.toDate === "function") v = v.toDate();
    const d = v instanceof Date ? v : new Date(v);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  } catch {
    return "";
  }
};

const FIELDS = [
  ["fajr", "Subuh"],
  ["dhuhr", "Dzuhur"],
  ["asr", "Ashar"],
  ["maghrib", "Maghrib"],
  ["isha", "Isya"],
  ["qiyamul_lail", "Qiyamul Lail"],
  ["fasting", "Puasa"],
];

const startOfLocalDayEpoch = (yyyy_mm_dd) => {
  const d = dayjs(yyyy_mm_dd + " 00:00:00");
  return Math.floor(d.valueOf() / 1000);
};

export default function Prayer({ user }) {
  // pointer siswa
  const [ptr, setPtr] = useState({
    npsn: "",
    kelasId: "",
    nisn: "",
  });
  const [loadingPtr, setLoadingPtr] = useState(true);

  // role & settings
  const [role, setRole] = useState("siswa");
  const [settings, setSettings] = useState({
    allowBackfillDays: 7,
    backfillLocked: true,
    rolesAllowedManual: ["admin_sekolah", "walas"],
    requireParentValidation: true,
  });

  // tanggal
  const today = dayjs();
  const [dateStr, setDateStr] = useState(today.format("YYYY-MM-DD"));
  const minDate = useMemo(() => {
    const days = settings.allowBackfillDays ?? 7;
    return today.subtract(days, "day").format("YYYY-MM-DD");
  }, [settings.allowBackfillDays]);

  // form & ui
  const [form, setForm] = useState({});
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [students, setStudents] = useState([]); // [{nisn, nama}]

  // ===== Query string (HARUS di dalam komponen)
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isManualQuery = params.get("manual") === "1";
  const qpNpsn = params.get("npsn") || "";
  const qpKelas = params.get("kelas") || params.get("kelasId") || "";
  const qpNisn = params.get("nisn") || "";
  const manualAllowed = role === "admin_sekolah" || role === "walas";
const manualMode = manualAllowed && isManualQuery;
const hasTarget = !!(ptr.npsn && ptr.kelasId && ptr.nisn);



  // --- Ambil user profile & settings sekolah ---
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      setLoadingPtr(true);
      const u = (await getDoc(doc(db, "users", user.uid))).data() || {};
      setRole(u.role || "siswa");
      setPtr((p) => ({
        ...p,
        npsn: u.npsn || u.sekolahId || p.npsn,
        kelasId: u.kelasId || u.idKelas || p.kelasId,
        nisn: u.nisn || p.nisn,
      }));
      if (u.npsn || u.sekolahId) {
        const ps =
          (
            await getDoc(
              doc(db, "sekolahtng", u.npsn || u.sekolahId, "settings", "prayer")
            )
          ).data() || {};
        setSettings({
          allowBackfillDays: ps.allowBackfillDays ?? 7,
          backfillLocked: !!ps.backfillLocked,
          rolesAllowedManual: ps.rolesAllowedManual || ["admin_sekolah", "walas"],
          requireParentValidation: !!ps.requireParentValidation,
        });
      }
      setLoadingPtr(false);
    })();
  }, [user?.uid]);

  // --- Override pointer dari query (mode manual)
  useEffect(() => {
    if (!manualMode) return;
    if (qpNpsn || qpKelas || qpNisn) {
      setPtr((p) => ({
        ...p,
        npsn: qpNpsn || p.npsn,
        kelasId: qpKelas || p.kelasId,
        nisn: qpNisn || p.nisn,
      }));
    }
  }, [manualMode, qpNpsn, qpKelas, qpNisn]);

  // --- Muat daftar siswa (untuk dropdown manual)
  useEffect(() => {
  if (!manualMode) return;
  if (ptr.npsn && !ptr.kelasId && ptr.nisn) {
    (async () => {
      try {
        const kelasSnap = await getDocs(collection(db, "sekolahtng", ptr.npsn, "kelas"));
        for (const kd of kelasSnap.docs) {
          const sRef = doc(db, "sekolahtng", ptr.npsn, "kelas", kd.id, "siswa", ptr.nisn);
          const sDoc = await getDoc(sRef);
          if (sDoc.exists()) {
            setPtr(p => ({ ...p, kelasId: kd.id }));
            break;
          }
        }
      } catch (e) {
        console.error("Auto-find kelasId failed", e);
      }
    })();
  }
}, [manualMode, ptr.npsn, ptr.kelasId, ptr.nisn]);

  // --- Lengkapi identitas (sekolah, kelas, siswa) ---
useEffect(() => {
  if (!ptr.npsn || !ptr.kelasId || !ptr.nisn) return;
  (async () => {
    try {
      const sekolah = (await getDoc(doc(db, "sekolahtng", ptr.npsn))).data();
      const kelas = (await getDoc(doc(db, "sekolahtng", ptr.npsn, "kelas", ptr.kelasId))).data();
      const siswa = (await getDoc(doc(db, "sekolahtng", ptr.npsn, "kelas", ptr.kelasId, "siswa", ptr.nisn))).data();
      setPtr((p) => ({
        ...p,
        namaSekolah: sekolah?.sekolah || sekolah?.namaSekolah || "",
        namaKelas: kelas?.namaKelas || "",
        walasNama: kelas?.walasNama || kelas?.waliKelas || "",
       namaSiswa: siswa?.nama || siswa?.namaLengkap || siswa?.name || "",
       namaOrtu: siswa?.namaOrtu || "",
        fotoURL: siswa?.fotoURL || siswa?.fotoUrl || siswa?.photoURL || "",
      }));
    } catch (e) {
      console.error("Gagal load identitas:", e);
    }
  })();
}, [ptr.npsn, ptr.kelasId, ptr.nisn]);


  // --- Load dokumen prayer_logs ---
  useEffect(() => {
    if (!ptr.npsn || !ptr.kelasId || !ptr.nisn || !dateStr) return;
    (async () => {
      setLoadingDoc(true);
      const ref = doc(
        db,
        "sekolahtng",
        ptr.npsn,
        "kelas",
        ptr.kelasId,
        "siswa",
        ptr.nisn,
        "prayer_logs",
        dateStr
      );
      const snap = await getDoc(ref);
      const v = snap.data() || {};
      setForm({
        fajr: !!v.fajr,
        fajr_at: v.fajr_at || null,
        dhuhr: !!v.dhuhr,
        dhuhr_at: v.dhuhr_at || null,
        asr: !!v.asr,
        asr_at: v.asr_at || null,
        maghrib: !!v.maghrib,
        maghrib_at: v.maghrib_at || null,
        isha: !!v.isha,
        isha_at: v.isha_at || null,
        qiyamul_lail: !!v.qiyamul_lail,
        qiyamul_lail_at: v.qiyamul_lail_at || null,
        fasting: !!v.fasting,
        fasting_at: v.fasting_at || null,
        note: v.note || "",
      });
      setLoadingDoc(false);
    })();
  }, [ptr.npsn, ptr.kelasId, ptr.nisn, dateStr]);

  // --- Save dengan aturan waktu tidak ditimpa ---
  const save = async () => {
    try {
      setMsg("");
      if (!user?.uid) return setMsg("Belum login.");
      if (!ptr.npsn || !ptr.kelasId || !ptr.nisn)
        return setMsg("Pointer siswa belum lengkap.");

      const selected = dayjs(dateStr);
      if (selected.isAfter(today, "day"))
        return setMsg("Tanggal masa depan tidak diizinkan.");

      // siswa & locked → batasi mundur
      if (role === "siswa" && settings.backfillLocked) {
        const diff = today.startOf("day").diff(selected.startOf("day"), "day");
        if (diff > (settings.allowBackfillDays ?? 7)) {
          return setMsg(
            `Melebihi batas ${settings.allowBackfillDays ?? 7} hari yang diizinkan.`
          );
        }
      }

      setSaving(true);
      const ref = doc(
        db,
        "sekolahtng",
        ptr.npsn,
        "kelas",
        ptr.kelasId,
        "siswa",
        ptr.nisn,
        "prayer_logs",
        dateStr
      );
      const old = (await getDoc(ref)).data() || {};
      const payload = {
        fajr: !!form.fajr,
        dhuhr: !!form.dhuhr,
        asr: !!form.asr,
        maghrib: !!form.maghrib,
        isha: !!form.isha,
        qiyamul_lail: !!form.qiyamul_lail,
        fasting: !!form.fasting,

        // Jangan timpa waktu lama
        fajr_at: form.fajr ? old.fajr_at || new Date() : null,
        dhuhr_at: form.dhuhr ? old.dhuhr_at || new Date() : null,
        asr_at: form.asr ? old.asr_at || new Date() : null,
        maghrib_at: form.maghrib ? old.maghrib_at || new Date() : null,
        isha_at: form.isha ? old.isha_at || new Date() : null,
        qiyamul_lail_at: form.qiyamul_lail
          ? old.qiyamul_lail_at || new Date()
          : null,
        fasting_at: form.fasting ? old.fasting_at || new Date() : null,

        note: form.note || "",
        date: dateStr,
        dateEpoch: startOfLocalDayEpoch(dateStr),
        userId: old.userId || user.uid,
        sekolahId: ptr.npsn,
        kelasId: ptr.kelasId,
        nisn: ptr.nisn,

        source: role === "siswa" ? "self" : "manual",
        actorUid: user.uid,
        actorRole: role,
        actorName: user.displayName || "",

        parentValidation:
          old.parentValidation || {
            status: "pending",
            byUid: null,
            byName: null,
            at: null,
          },

        updatedAt: new Date(),
        createdAt: old.createdAt || new Date(),
      };
      await setDoc(ref, payload, { merge: true });
      setMsg("Tersimpan!");
    } catch (e) {
      console.error(e);
      setMsg("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const setCheck = (k) => (e) =>
    setForm((s) => ({ ...s, [k]: e.target.checked }));

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-white">
          <h2 className="text-lg font-semibold">Pencatatan Sholat</h2>
          <p className="text-sm opacity-90">
            Catat ibadah harian (maks. mundur {settings.allowBackfillDays} hari)
          </p>
        </div>

        
        {manualMode  && !hasTarget && (
          <div className="mx-4 mt-3 rounded-lg border border-indigo-100 p-2">
            <div className="text-xs font-semibold text-indigo-700">
              Mode Entri Manual
            </div>
            <div className="mt-2">
              <select
                className="w-full rounded-md border px-2 py-1 text-sm"
                value={ptr.nisn}
                onChange={(e) =>
                  setPtr((p) => ({ ...p, nisn: e.target.value }))
                }
              >
                <option value="">— Pilih Siswa —</option>
                {students.map((s) => (
                  <option key={s.nisn} value={s.nisn}>
                    {s.nisn} — {s.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Identitas */}
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="rounded-xl border p-3">
            <div className="text-xs font-semibold text-slate-500">Identitas</div>
            <div className="mt-1 flex gap-3 text-sm">
              <img
                src={ptr.fotoURL || "https://dummyimage.com/80x80/eee/999&text=--"} 
                referrerPolicy="no-referrer"
                alt="Foto Profil"
                className="h-16 w-16 rounded-lg border object-cover"
              />
              <ul className="flex-1 space-y-1">
                <li>
                  <span className="text-slate-500">Nama</span>{" "}
                  <span className="font-medium">{ptr.namaSiswa || "-"}</span>
                </li>
                <li>
                  <span className="text-slate-500">Sekolah</span>{" "}
                  <span className="font-medium">{ptr.namaSekolah || "-"}</span>
                </li>
                <li>
                  <span className="text-slate-500">Kelas</span>{" "}
                  <span className="font-medium">{ptr.namaKelas || "-"}</span>
                </li>
                <li>
                  <span className="text-slate-500">Wali Kelas</span>{" "}
                  <span className="font-medium">{ptr.walasNama || "-"}</span>
                </li>
                <li>
                  <span className="text-slate-500">NISN</span>{" "}
                  <span className="font-medium">{ptr.nisn || "-"}</span>
                </li>
                <li>
                  <span className="text-slate-500">Orang Tua</span>{" "}
                  <span className="font-medium">{ptr.namaOrtu || "-"}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tanggal */}
          <div className="rounded-xl border p-3">
            <div className="text-xs font-semibold text-slate-500">Tanggal</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="date"
                className="rounded-md border px-2 py-1 text-sm"
                value={dateStr}
                min={role === "siswa" && settings.backfillLocked ? minDate : ""}
                max={today.format("YYYY-MM-DD")}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* (Opsional) Kembali ke daftar admin */}
        <div className="px-4">
          <Link to="/admin/daftar-siswa" className="btn-ghost">
            ← Kembali ke Daftar
          </Link>
        </div>

        {/* Form ceklis */}
        <div className="border-t p-4">
          {loadingDoc ? (
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FIELDS.map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-xl border p-3"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-indigo-600"
                      checked={!!form[key]}
                      onChange={setCheck(key)}
                    />
                    <span className="text-sm font-medium">{label}</span>
                    {form[`${key}_at`] && (
                      <span className="ml-auto text-xs text-slate-500">
                        {fmtHM(form[`${key}_at`])}
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <textarea
                className="mt-3 w-full rounded border p-2 text-sm"
                rows={3}
                placeholder="Catatan (opsional)…"
                value={form.note || ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, note: e.target.value }))
                }
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="btn-primary disabled:opacity-60"
                >
                  {saving ? "Menyimpan…" : "Simpan"}
                </button>
                {msg && (
                  <span
                    className={`text-sm ${
                      msg.includes("Tersimpan")
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {msg}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
