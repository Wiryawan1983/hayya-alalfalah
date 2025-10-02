import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import { db, storage } from "../firebase";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";
import Topbar from "../components/Topbar";
import "dayjs/locale/id";
dayjs.extend(updateLocale);

// ganti nama hari di locale Indonesia
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
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  } catch { return ""; }
};

// sekarang:
dayjs().format("dddd, DD MMMM YYYY"); // "Ahad, 28 September 2025"

export default function Home({ user, profile }) {
  const [ptr, setPtr] = useState({ sekolahId: "", kelasId: "", nisn: "" });
  const [loadingPtr, setLoadingPtr] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try { 
        setLoadingPtr(true);
        const pSek = profile?.sekolahId || profile?.npsn || "";
        const pKls = profile?.idKelas || profile?.kelasId || "";
        const pNisn = profile?.nisn || "";
        if (pSek && pKls && pNisn) {
          if (active) setPtr({ sekolahId: pSek, kelasId: pKls, nisn: pNisn });
        } else if (user?.uid) {
          const usnap = await getDoc(doc(db, "users", user.uid));
          const u = usnap.data() || {};
          const sekolahId = u.sekolahId || u.npsn || "";
          const namaSekolah = u.namaSekolah;
          const kelasId = u.idKelas || u.kelasId || "";
          const nisn = u.nisn || "";
          if (active) setPtr({ sekolahId, kelasId, nisn });
        }
      } finally {
        if (active) setLoadingPtr(false);
      }
    })();
    return () => (active = false);
  }, [user?.uid, profile]);

  function Label({ children }) {
  return <label className="text-sm font-medium text-slate-700">{children}</label>;
}

function Input({ label, className = "", ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        {...props}
        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
      />
    </div>
  );
}


  return (
    <>
      <Topbar user={user} profile={profile} title="Dashboard Siswa" school={null} />

      <div className="mx-auto grid max-w-screen-xl gap-4 p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
        {/* INPUT IBADAH */}
        <Card 
            title="Input Ibadah Hari Ini" 
            subtitle={dayjs().format("dddd, DD MMMM YYYY")}   // ✅ otomatis bahasa Indonesia
          >
          <QuickPrayerCard user={user} ptr={ptr} loadingPtr={loadingPtr} />
        </Card>

        {/* REKAP 7 HARI TERAKHIR */}
        <Card className="md:col-span-2 xl:col-span-2" title="Rekap 7 Hari Terakhir">
          {!ptr.sekolahId || !ptr.kelasId || !ptr.nisn ? (
            <PointerAlert />
          ) : (
            <div className="-mx-2 overflow-x-auto px-2">
              <PrettyRecapTable
                sekolahId={ptr.sekolahId}
                kelasId={ptr.kelasId}
                nisn={ptr.nisn}
              />
            </div>
          )}
        </Card>

        {/* IDENTITAS */}
        <Card title="Identitas Siswa">
          {loadingPtr ? (
            <SkeletonList />
          ) : (
            <StudentIdentity user={user} ptr={ptr} />
          )}
        </Card>

        {/* TINDAKAN */}
        <Card title="Tindakan">
          <div className="flex flex-wrap gap-2">
            <Link className="btn-primary" to="/verify">Verifikasi Siswa</Link>
            <Link className="btn-ghost" to="/prayer">Form Ibadah (Halaman Penuh)</Link>
            <Link className="btn-ghost" to="/invite">Buat Kode (Wali Kelas / Siswa)</Link>
            <Link className="btn-ghost" to="/redeem">Klaim Kode (Orang Tua)</Link>
          </div>
        </Card>
      </div>
    </>
  );
}

/* ---------------------------------- */
/* Components                        */
/* ---------------------------------- */
function Card({ title, subtitle, className = "", children }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {subtitle && (
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function PointerAlert() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20">⚠️</span>
      <div>
        Pointer siswa belum lengkap. Silakan verifikasi di menu <b>Verifikasi Siswa</b> terlebih dahulu.
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[0, 1, 2,3].map((i) => (
        <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

/* ---------- TABEL REKAP KEREN ---------- */
function PrettyRecapTable({ sekolahId, kelasId, nisn }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const days = [...Array(7)].map((_, i) => dayjs().subtract(i, "day").format("YYYY-MM-DD")).reverse();

        const snaps = await Promise.all(days.map(async (d) => {
          const s = await getDoc(doc(db, "sekolahtng", sekolahId, "kelas", kelasId, "siswa", nisn, "prayer_logs", d));
          return { id: d, data: s.data() || {} };
        }));
        if (!active) return;

        const checks = ["fajr","dhuhr","asr","maghrib","isha","qiyamul_lail","fasting"];

        const mapped = snaps.map(({ id, data }) => {
          const done = checks.reduce((acc,k)=>acc + (data[k] ? 1 : 0), 0);
          const pct = Math.round((done / checks.length) * 100);
          const times = checks.reduce((o,k)=>({ ...o, [`${k}_at`]: data[`${k}_at`] || null }), {});
          return {
            date: id,
            ...checks.reduce((o,k)=>({ ...o, [k]: !!data[k]}),{}),
            ...times,
            note: data.note || data.notes || "",
            pct, done,
          };
        });

        setRows(mapped);
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [sekolahId, kelasId, nisn]);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = rows.length - 1; i >= 0; i--) { if (rows[i].done >= 3) s++; else break; }
    return s;
  }, [rows]);

  if (loading) return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />;

  const Head = ["Tanggal","Subuh","Dzuhur","Ashar","Maghrib","Isya","QL","Puasa","Skor"];

  const CellCheck = ({ ok, at }) => (
    <div className="leading-tight">
      <div>{ok ? "✅" : "—"}</div>
      <div className="text-[10px] text-slate-500">{ok ? fmtHM(at) : ""}</div>
    </div>
  );

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
        <div className="text-sm">
          <span className="font-semibold">Streak:</span>{" "}
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{streak} hari</span>
        </div>
        <div className="text-xs text-slate-500">Jam kecil = waktu dicentang</div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-white">
          <tr className="border-b">
            {Head.map((h,i)=> <Th key={i} className={i===Head.length-1 ? "text-right": ""}>{h}</Th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.date} className={i % 2 ? "bg-slate-50/60" : "bg-white"}>
              <Td>{dayjs(r.date).format("ddd, DD MMM")}</Td>
              <Td><CellCheck ok={r.fajr}     at={r.fajr_at} /></Td>
              <Td><CellCheck ok={r.dhuhr}    at={r.dhuhr_at} /></Td>
              <Td><CellCheck ok={r.asr}      at={r.asr_at} /></Td>
              <Td><CellCheck ok={r.maghrib}  at={r.maghrib_at} /></Td>
              <Td><CellCheck ok={r.isha}     at={r.isha_at} /></Td>
              <Td><CellCheck ok={r.qiyamul_lail} at={r.qiyamul_lail_at} /></Td>
              <Td><CellCheck ok={r.fasting}  at={r.fasting_at} /></Td>
              <Td className="text-right">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor(r.pct)}`}>
                  {r.pct}%
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className="" }) {
  return <th className={`px-3 py-2 text-left font-semibold text-slate-700 ${className}`}>{children}</th>;
}
function Td({ children, className="" }) {
  return <td className={`px-3 py-2 text-slate-700 ${className}`}>{children}</td>;
}
function badgeColor(p){
  if (p >= 80) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (p >= 50) return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
}

/* ---------- IDENTITAS + EDIT PROFIL ---------- */
function StudentIdentity({ user, ptr }) {
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    namaOrtu: "",
    notelpOrtu: "",
    tempatLahir: "",
    tanggalLahir: "",
    photoFile: null,
    fotoURL: "",
  });

  const [saving, setSaving] = useState(false);

  // Ambil: nama sekolah, nama kelas, wali kelas + data profil siswa
  useEffect(() => {
    let active = true;
    (async () => {
      if (!ptr.sekolahId || !ptr.kelasId || !ptr.nisn) {
        if (active) setInfo({});
        return;
      }

      try {
        // 1) dokumen siswa
        const siswaRef = doc(db, "sekolahtng", ptr.sekolahId, "kelas", ptr.kelasId, "siswa", ptr.nisn);
        const siswaSnap = await getDoc(siswaRef);
        const s = siswaSnap.data() || {};

        // 2) dokumen kelas (untuk namaKelas & wali kelas)
        const kelasRef = doc(db, "sekolahtng", ptr.sekolahId, "kelas", ptr.kelasId);
        const kelasSnap = await getDoc(kelasRef);
        const k = kelasSnap.data() || {};

        // 3) dokumen sekolah (untuk nama sekolah)
        const sekolahRef = doc(db, "sekolahtng", ptr.sekolahId);
        const sekolahSnap = await getDoc(sekolahRef);
        const sk = sekolahSnap.data() || {};

        const result = {
          // identitas relasi
          sekolahName: sk.sekolah || sk.namaSekolah || ptr.sekolahId,
          kelasName: k.namaKelas || ptr.kelasId,
          walasName: k.walasNama || k.waliKelas || "",
          

          // data siswa
          nisn: ptr.nisn,
          namaOrtu: s.namaOrtu || "",
          notelpOrtu: s.notelpOrtu || "",
          tempatLahir: s.tempatLahir || "",
          tanggalLahir: s.tanggalLahir || "",
          fotoURL: s.fotoURL || "",
        };

        if (active) {
          setInfo(result);
          setForm((f) => ({
            ...f,
            namaOrtu: result.namaOrtu,
            notelpOrtu: result.notelpOrtu,
            tempatLahir: result.tempatLahir,
            tanggalLahir: result.tanggalLahir,
            fotoURL: result.fotoURL,
          }));
        }
      } catch (e) {
        console.error(e);
        if (active) setInfo({});
      }
    })();

    return () => { active = false; };
  }, [ptr.sekolahId, ptr.kelasId, ptr.nisn]);

  return (
    <>
      {!info ? (
        <SkeletonList />
      ) : (
        <div className="space-y-2 text-sm text-slate-700">
          <Row label="Nama Sekolah" value={info.sekolahName || "-"} />
          <Row label="Nama Kelas" value={info.kelasName || "-"} />
          <Row label="Wali Kelas" value={info.walasName || "-"} />
          <Row label="Nama Siswa" value={info.namaSiswa || "-"} />
          <Row label="NISN" value={info.nisn || "-"} />

          {info.fotoURL && (
            <div className="pt-2">
              <img
                alt="Foto Siswa"
                src={info.fotoURL}
                className="h-24 w-24 rounded-lg border object-cover"
              />
            </div>
          )}

          <div className="pt-2">
            <button className="btn-primary" onClick={() => setOpen(true)}>
              Edit Profil Siswa
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 text-base font-semibold">Edit Profil Siswa</div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <label className="text-sm font-medium text-slate-700">Nama Orang Tua</label>
                <input
                  value={form.namaOrtu}
                  onChange={(e)=>setForm(s=>({...s,namaOrtu:e.target.value}))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">No HP Ortu</label>
                <input
                  value={form.notelpOrtu}
                  onChange={(e)=>setForm(s=>({...s,notelpOrtu:e.target.value}))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Tempat Lahir</label>
                <input
                  value={form.tempatLahir}
                  onChange={(e)=>setForm(s=>({...s,tempatLahir:e.target.value}))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Tanggal Lahir</label>
                <input
                  type="date"
                  value={form.tanggalLahir || ""}
                  onChange={(e)=>setForm(s=>({...s,tanggalLahir:e.target.value}))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Foto (opsional)</label>
                <input
                  type="file" accept="image/*"
                  onChange={(e)=>setForm(s=>({...s, photoFile: e.target.files?.[0] || null}))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {form.fotoURL && (
                  <img alt="preview" src={form.fotoURL} className="mt-2 h-20 w-20 rounded-lg object-cover border" />
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="btn-ghost" onClick={()=>setOpen(false)}>Batal</button>
              <button
                className="btn-primary"
                disabled={saving}
                onClick={async () => {
                  try {
                    if (!user?.uid || !ptr.sekolahId || !ptr.kelasId || !ptr.nisn) {
                      alert("Pointer belum lengkap."); return;
                    }
                    setSaving(true);

                    // (1) Upload foto jika ada
                    let fotoURL = form.fotoURL || "";
                    if (form.photoFile) {
                      const ext = (form.photoFile.type.split("/")[1] || "jpg").toLowerCase();
                      // gunakan sekolahId (bukan npsn di state)
                      const storageRef = sref(
                        storage,
                        `foto_sekolah/${ptr.sekolahId}/siswa/${ptr.nisn}/profile.${ext}`
                      );
                      await uploadBytes(storageRef, form.photoFile, { contentType: form.photoFile.type });
                      fotoURL = await getDownloadURL(storageRef);
                    }

                    // (2) Simpan field profil
                    const payload = {
                      namaOrtu: (form.namaOrtu || "").trim(),
                      notelpOrtu: (form.notelpOrtu || "").trim(),
                      tempatLahir: (form.tempatLahir || "").trim(),
                      tanggalLahir: form.tanggalLahir || "",
                      fotoURL,
                      updatedAt: new Date(),
                    };

                    await setDoc(doc(db, "users", user.uid), payload, { merge: true });

                    await setDoc(
                      doc(db, "sekolahtng", ptr.sekolahId, "kelas", ptr.kelasId, "siswa", ptr.nisn),
                      payload,
                      { merge: true }
                    );

                    setForm((s) => ({ ...s, fotoURL }));
                    setOpen(false);
                    alert("Profil siswa tersimpan.");
                  } catch (e) {
                    console.error(e);
                    alert("Gagal menyimpan profil: " + (e.message || e.code || e));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function Row({ label, value }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value || "-"}</span>
    </li>
  );
}

/* ---------- Quick input ibadah (tetap) ---------- */
function QuickPrayerCard({ user, ptr, loadingPtr }) {
  const dateId = dayjs().format("YYYY-MM-DD");
  const [saving, setSaving] = useState(false);

  // nilai checklist
  const [form, setForm] = useState({
    fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false, qiyamul_lail: false, fasting: false, note: "",
  });

  // waktu sholat (dari versi sebelumnya – tetap dipakai untuk lock sebelum waktunya)
  const [times, setTimes] = useState(null);
  const [loadingTimes, setLoadingTimes] = useState(true);
  const [locErr, setLocErr] = useState("");

  // ===== Ambil jadwal sholat (sama seperti jawaban sebelumnya) =====
  const parseHM = (hm) => {
    const [H, M] = (hm || "00:00").split(":").map((x)=>parseInt(x,10));
    const d = new Date(); d.setHours(H, M, 0, 0); return d;
  };
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingTimes(true);
        const getPosition = () =>
          new Promise((resolve) => {
            if (!navigator.geolocation) return resolve(null);
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve(pos.coords),
              () => resolve(null),
              { enableHighAccuracy: true, timeout: 8000 }
            );
          });
        const coords = await getPosition();
        const lat = coords?.latitude ?? -6.1783;
        const lon = coords?.longitude ?? 106.6319;
        if (!coords) setLocErr("Lokasi default dipakai (Tangerang). Aktifkan GPS untuk akurasi.");

        const today = dayjs().format("DD-MM-YYYY");
        const url = `https://api.aladhan.com/v1/timings/${today}?latitude=${lat}&longitude=${lon}&method=2`;
        const res = await fetch(url);
        const json = await res.json();
        const t = json?.data?.timings || {};
        const toHM = (s) => (s || "").split(" ")[0];

        const fajrHM = toHM(t.Fajr);
        const dhuhrHM = toHM(t.Dhuhr);
        const asrHM = toHM(t.Asr);
        const maghribHM = toHM(t.Maghrib);
        const ishaHM = toHM(t.Isha);

        const ishaDate = parseHM(ishaHM);
        const fajrDate = parseHM(fajrHM);
        if (fajrDate <= ishaDate) fajrDate.setDate(fajrDate.getDate() + 1);

        if (active) {
          setTimes({
            fajr: fajrHM, dhuhr: dhuhrHM, asr: asrHM, maghrib: maghribHM, isha: ishaHM,
            qlStart: ishaDate, qlEnd: fajrDate, fastingEnabledAfter: parseHM(maghribHM),
          });
        }
      } catch (e) {
        console.error(e); setLocErr("Gagal mengambil jadwal sholat. Coba refresh.");
      } finally {
        if (active) setLoadingTimes(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // ======= Listener dokumen hari ini (real-time) =======
  useEffect(() => {
    if (!ptr.sekolahId || !ptr.kelasId || !ptr.nisn) return;
    const refDoc = doc(
      db, "sekolahtng", ptr.sekolahId, "kelas", ptr.kelasId, "siswa", ptr.nisn, "prayer_logs", dateId
    );
    const unsub = onSnapshot(refDoc, (snap) => {
      const d = snap.data() || {};
      setForm((s) => ({
        ...s,
        fajr: !!d.fajr, dhuhr: !!d.dhuhr, asr: !!d.asr, maghrib: !!d.maghrib, isha: !!d.isha,
        qiyamul_lail: !!d.qiyamul_lail, fasting: !!d.fasting, note: d.note || d.notes || s.note || "",
      }));
      // tidak perlu simpan times di state terpisah; kita render dari d langsung di "Status Hari Ini"
      setSavedDoc(d);
    });
    return () => unsub();
  }, [ptr.sekolahId, ptr.kelasId, ptr.nisn, dateId]);

  // simpan “jejak waktu” untuk tampilan status
  const [savedDoc, setSavedDoc] = useState({});

  // aturan enable/disable
  const now = new Date();
  const isEnabled = (key) => {
    if (!times) return false;
    switch (key) {
      case "fajr":     return now >= parseHM(times.fajr);
      case "dhuhr":    return now >= parseHM(times.dhuhr);
      case "asr":      return now >= parseHM(times.asr);
      case "maghrib":  return now >= parseHM(times.maghrib);
      case "isha":     return now >= parseHM(times.isha);
      case "qiyamul_lail": return now >= times.qlStart && now < times.qlEnd;
      case "fasting":  return now >= times.fastingEnabledAfter;
      default: return true;
    }
  };

  // helper format jam
  const fmtTime = (v) => {
    if (!v) return "";
    // v bisa Date, atau Firestore Timestamp, atau string ISO
    try {
      if (typeof v?.toDate === "function") v = v.toDate();
      const d = v instanceof Date ? v : new Date(v);
      const hh = String(d.getHours()).padStart(2,"0");
      const mm = String(d.getMinutes()).padStart(2,"0");
      return `${hh}:${mm}`;
    } catch { return ""; }
  };

  // klik = langsung simpan field terkait
  const toggleAndSave = async (key) => {
    if (!isEnabled(key)) return;
    if (!user?.uid) return alert("Anda belum login.");
    if (!ptr.sekolahId || !ptr.kelasId || !ptr.nisn) {
      return alert("Pointer belum lengkap. Verifikasi dulu di menu Verifikasi Siswa.");
    }

    const refDoc = doc(
      db, "sekolahtng", ptr.sekolahId, "kelas", ptr.kelasId, "siswa", ptr.nisn, "prayer_logs", dateId
    );

    const newVal = !form[key];
    setForm((s) => ({ ...s, [key]: newVal })); // optimistik

    try {
      await setDoc(
        refDoc,
        {
          [key]: newVal,
          // simpan waktu saat dicentang; kosongkan saat dibatalkan
          [`${key}_at`]: newVal ? new Date() : null,
          date: dateId, userId: user.uid,
          sekolahId: ptr.sekolahId, kelasId: ptr.kelasId, nisn: ptr.nisn,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan. Coba lagi.");
      // rollback jika perlu
      setForm((s) => ({ ...s, [key]: !newVal }));
    }
  };

  const fields = [
    ["fajr", "Subuh",    () => times?.fajr],
    ["dhuhr","Dzuhur",   () => times?.dhuhr],
    ["asr",  "Ashar",    () => times?.asr],
    ["maghrib","Maghrib",() => times?.maghrib],
    ["isha", "Isya",     () => times?.isha],
    ["qiyamul_lail","Qiyamul Lail", () => {
      if (!times) return "";
      const fmt = (d)=>`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
      return `${fmt(times.qlStart)}–${fmt(times.qlEnd)}`;
    }],
    ["fasting","Puasa",  () => times ? `✓ setelah ${times.maghrib}` : ""],
  ];

  const saveNoteOnly = async () => {
    try {
      if (!user?.uid) return alert("Anda belum login.");
      if (!ptr.sekolahId || !ptr.kelasId || !ptr.nisn) return alert("Pointer belum lengkap.");
      setSaving(true);
      const refDoc = doc(
        db, "sekolahtng", ptr.sekolahId, "kelas", ptr.kelasId, "siswa", ptr.nisn, "prayer_logs", dateId
      );
      await setDoc(refDoc, { note: form.note, notes: form.note, updatedAt: serverTimestamp() }, { merge: true });
      alert("Catatan tersimpan.");
    } catch (e) {
      console.error(e); alert("Gagal menyimpan catatan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-1 text-xs text-slate-500">Tanggal: {dateId}</div>
      {locErr && <div className="mb-2 text-xs text-amber-700">{locErr}</div>}

      {loadingPtr || loadingTimes ? (
        <SkeletonChecks />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {fields.map(([key, label, getTime]) => (
              <ToggleTile
                key={key}
                checked={!!form[key]}
                onChange={() => toggleAndSave(key)}
                label={label}
                subLabel={getTime?.() || ""}
                disabled={!isEnabled(key)}
              />
            ))}
          </div>

          {/* Catatan */}
          <textarea
            placeholder="Catatan (opsional)…"
            value={form.note}
            onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
            rows={3}
            className="mt-3 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="mt-3 flex items-center gap-2">
            <button onClick={saveNoteOnly} disabled={saving} className="btn-primary">
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
            <Link to="/prayer" className="btn-ghost">Buka Form Lengkap</Link>
          </div>

          {/* Status Hari Ini */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-sm font-semibold text-slate-700">Status Hari Ini</div>
            <ul className="space-y-1 text-sm">
              {["fajr","dhuhr","asr","maghrib","isha","qiyamul_lail","fasting"].map((k) => (
                <li key={k} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                  <span className="capitalize">
                    {k === "fajr" ? "Subuh"
                      : k === "dhuhr" ? "Dzuhur"
                      : k === "asr" ? "Ashar"
                      : k === "maghrib" ? "Maghrib"
                      : k === "isha" ? "Isya"
                      : k === "qiyamul_lail" ? "Qiyamul Lail"
                      : "Puasa"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    {savedDoc?.[k] ? "✅" : "—"}
                    <span className="text-xs text-slate-500">
                      {fmtTime(savedDoc?.[`${k}_at`])}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}



function ToggleTile({ checked, onChange, label, subLabel = "", disabled = false }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      title={disabled ? "Belum masuk waktunya" : ""}
      className={`group flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-sm transition-all
        ${checked ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}
        ${disabled ? "opacity-60 cursor-not-allowed hover:bg-white" : ""}
      `}
    >
      <div className="min-w-0 pr-2">
        <div className="truncate">{label}</div>
        {subLabel && <div className="mt-0.5 text-xs text-slate-500">{subLabel}</div>}
      </div>
      <span
        className={`ml-3 inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-inset
          ${checked ? "bg-emerald-500 ring-emerald-600 text-white" : "bg-white ring-slate-300"}`
        }
      >
        {checked ? "✓" : ""}
      </span>
    </button>
  );
}


function SkeletonChecks() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}
