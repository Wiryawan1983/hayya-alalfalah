// src/pages/AdminSekolah.jsx — Tailwind Revamp
import React, { useEffect, useState, useRef } from "react";
import Topbar from "../components/Topbar";
import SchoolProfileDialog from "../components/profile/SchoolProfileDialog";
import RecapIbadahDashboard from "../components/recap/RecapIbadahDashboard";
import LogoutButton from "../components/LogoutButton";
import { Link } from "react-router-dom";




import { db, storage } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/* ------------------------------ UI Tokens ------------------------------ */
const BTN = {
  primary:
    "inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
  ghost:
    "inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300",
  danger:
    "inline-flex items-center rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300",
  icon:
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50",
};
const CARD = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const HSEC = "mb-3 flex items-center justify-between";

/* ------------------------------ Menu Items ----------------------------- */
const MENU = [
  { key: "profil", label: "Profil Sekolah" },
  { key: "data", label: "Data (Guru/Kelas/Siswa)" },
  { key: "rekap", label: "Rekap Ibadah" },
  
];




/* ------------------------------ Icons ---------------------------------- */
const ICONS = {
  profil: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="currentColor" />
    </svg>
  ),
  data: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="4" width="18" height="4" rx="1" fill="currentColor" />
      <rect x="3" y="10" width="18" height="4" rx="1" fill="currentColor" />
      <rect x="3" y="16" width="18" height="4" rx="1" fill="currentColor" />
    </svg>
  ),
  rekap: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M4 4h16v16H4z" fill="none" stroke="currentColor" />
      <path d="M7 14l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};

const TAB_ICONS = {
  kelas: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <rect x="3" y="4" width="18" height="12" rx="2"></rect>
      <path d="M3 18h18v2H3z"></path>
    </svg>
  ),
  guru: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <circle cx="12" cy="8" r="3.5"></circle>
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6"></path>
    </svg>
  ),
  siswa: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M3 7l9-4 9 4-9 4-9-4z"></path>
      <path d="M3 12l9 4 9-4" fill="none" stroke="currentColor"></path>
    </svg>
  ),
};

const ACTION_ICONS = {
  edit: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"></path>
      <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path>
    </svg>
  ),
  photo: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M20 6h-3.2l-1.2-2H8.4L7.2 6H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-8 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"></path>
    </svg>
  ),
  delete: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M6 7h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"></path>
      <path d="M9 3h6l1 2h5v2H3V5h5l1-2z"></path>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z"></path>
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"></path>
    </svg>
  ),
};

/* ------------------------------ Helpers -------------------------------- */
async function uploadImageAndGetURL(file, path, onProgress) {
  if (!file) return "";
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);
  return await new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress && onProgress(pct);
      },
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}
const askConfirm = (msg) => (typeof window !== "undefined" ? window.confirm(msg) : true);

const IconButton = ({ title, onClick, danger, children }) => (
  <button
    onClick={onClick}
    aria-label={title}
    title={title}
    className={`${BTN.icon} ${danger ? "border-red-300 text-red-600 hover:bg-red-50" : ""}`}
  >
    {children}
  </button>
);

const Avatar = ({ url }) =>
  url ? (
    <img
      src={url}
      alt="avatar"
      className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
    />
  ) : (
    <div className="grid h-10 w-10 place-content-center rounded-lg border border-slate-200 bg-slate-50 text-lg">👤</div>
  );

const Label = ({ children }) => (
  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</div>
);
const Value = ({ children }) => (
  <div className="font-medium text-slate-800">{children || "-"}</div>
);


/* ------------------------------ Page ----------------------------------- */
export default function AdminSekolah({ user, profile }) {
  const sid = profile?.sekolahId;
  const [active, setActive] = useState("profil");
  const [collapsed, setCollapsed] = useState(false);

  // Profil sekolah
  const [sekolahInfo, setSekolahInfo] = useState(null);
  const [loadingSekolah, setLoadingSekolah] = useState(false);
  const [openEditSekolah, setOpenEditSekolah] = useState(false);

  // Ambil NPSN sekolah aktif dari state/profil kamu
// NPSN sekolah aktif (ambil dari profil/user yang sudah ada di komponenmu)
    const schoolNpsn =
  (typeof profile !== "undefined" && (profile.npsn || profile.sekolahId)) ||
  (typeof user !== "undefined" && (user.npsn || user.sekolahId)) ||
  "";

    // sanitizer: buang "undefined"/"null" string
    const ok = (v) => (v && v !== "undefined" && v !== "null" ? v : null);

    // builder URL untuk mode entri manual
    
    const manualLink = (s) => {
  const p = new URLSearchParams({ manual: "1" });
  // NPSN/ID sekolah: pakai 'sid' saja biar pasti terisi
  if (sid) p.set("npsn", sid);

  // Kelas: ambil dari selectedKelas (bisa string/objek) DAN/ATAU dari siswa
  const kid =
    (typeof selectedKelas === "string" && selectedKelas) ||
    selectedKelas?.id ||
    selectedKelas?.kode ||
    s?.kelasId ||
    s?.kelas ||
    "";

  if (kid) p.set("kelas", kid);

  // NISN: dari objek siswa yang sedang dirender
  const nisn = s?.id || s?.nisn || "";
  if (nisn) p.set("nisn", nisn);

  return `/prayer?${p.toString()}`;
};



  useEffect(() => {
    (async () => {
      if (!sid) { setSekolahInfo(null); return; }
      setLoadingSekolah(true);
      try {
        const snap = await getDoc(doc(db, "sekolahtng", sid));
        const data = snap.exists() ? snap.data() : {};
        const propinsi = data.propinsi || data.provinsi || data.province || "";
        setSekolahInfo({
          id: sid,
          alamat_jalan: data.alamat_jalan || "",
          bentuk: data.bentuk || "",
          bujur: Number(data.bujur || 0),
          kabupaten_kota: data.kabupaten_kota || data.kabupaten || "",
          kecamatan: data.kecamatan || "",
          kode_kab_kota: data.kode_kab_kota || "",
          kode_kec: data.kode_kec || "",
          kode_prop: data.kode_prop || "",
          lintang: Number(data.lintang || 0),
          npsn: data.npsn || sid,
          propinsi,
          sekolah: data.sekolah || data.namaSekolah || "",
          status: data.status || "",
          logoURL: data.logoURL || data.logoUrl || data.logo || "",
        });
      } catch (e) {
        console.error(e);
        setSekolahInfo(null);
      } finally { setLoadingSekolah(false); }
    })();
  }, [sid]);

  // Data listing
  const [kelas, setKelas] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [siswa, setSiswa] = useState([]);
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [guru, setGuru] = useState([]);

  useEffect(() => {
    (async () => {
      if (!sid) return;
      const kelasSnap = await getDocs(collection(db, "sekolahtng", sid, "kelas"));
      setKelas(kelasSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      const guruSnap = await getDocs(collection(db, "sekolahtng", sid, "guru"));
      setGuru(guruSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, [sid]);

  useEffect(() => {
    (async () => {
      if (!sid || !selectedKelas) { setSiswa([]); setSelectedSiswa(""); return; }
      const snap = await getDocs(collection(db, "sekolahtng", sid, "kelas", selectedKelas, "siswa"));
      setSiswa(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, [sid, selectedKelas]);

  /* --------------------------- Section: Profil -------------------------- */
  const SectionProfil = () => (
    <section className={CARD}>
      <div className={HSEC}>
        <h3 className="text-lg font-semibold">Profil Sekolah</h3>
        {sid && (
          <button onClick={() => setOpenEditSekolah(true)} className={BTN.ghost}>
            Edit Profil
          </button>
        )}
      </div>

      {!sid ? (
        <div className="text-slate-600">Data sekolah belum lengkap.</div>
      ) : loadingSekolah ? (
        <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
      ) : !sekolahInfo ? (
        <div className="text-slate-600">Dokumen sekolah tidak ditemukan.</div>
      ) : (
        <>
          {/* Header kartu profil */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid h-16 w-16 place-content-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              {sekolahInfo.logoURL ? (
                <img src={sekolahInfo.logoURL} alt="Logo Sekolah" className="h-16 w-16 object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xs text-slate-400">No Logo</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">{sekolahInfo.sekolah || "-"}</div>
              <div className="text-xs text-slate-600">
                {sekolahInfo.bentuk || "-"} • {sekolahInfo.kecamatan || "-"}, {sekolahInfo.kabupaten_kota || "-"}
              </div>
              <div className="text-xs text-slate-500">NPSN: {sekolahInfo.npsn || "-"}</div>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-2">
            <Label>ID</Label><Value>{sekolahInfo.id}</Value>
            <Label>NPSN</Label><Value>{sekolahInfo.npsn}</Value>
            <Label>Sekolah</Label><Value>{sekolahInfo.sekolah}</Value>
            <Label>Bentuk</Label><Value>{sekolahInfo.bentuk}</Value>
            <Label>Provinsi</Label><Value>{sekolahInfo.propinsi}</Value>
            <Label>Kabupaten/Kota</Label><Value>{sekolahInfo.kabupaten_kota}</Value>
            <Label>Kecamatan</Label><Value>{sekolahInfo.kecamatan}</Value>
            <Label>Alamat</Label><Value>{sekolahInfo.alamat_jalan}</Value>
            <Label>Lintang</Label><Value>{sekolahInfo.lintang ?? 0}</Value>
            <Label>Bujur</Label><Value>{sekolahInfo.bujur ?? 0}</Value>
            <Label>Status</Label><Value>{sekolahInfo.status || "-"}</Value>
            {!!guru.length && (
              <>
                <Label>Guru (Pengampu)</Label>
                <Value>
                  <ul className="ml-4 list-disc text-sm text-slate-700">
                    {guru.map((g) => (
                      <li key={g.id}>{g.nama || "(tanpa nama)"}</li>
                    ))}
                  </ul>
                </Value>
              </>
            )}
          </div>

          {openEditSekolah && (
            <SchoolProfileDialog
              sid={sid}
              initial={sekolahInfo}
              onSaved={(upd) => setSekolahInfo((prev) => ({ ...(prev || {}), ...upd }))}
              onClose={() => setOpenEditSekolah(false)}
            />
          )}
        </>
      )}
    </section>
  );

  /* ---------------------------- Section: Data --------------------------- */
  const SectionData = () => {
    const [tab, setTab] = useState("kelas"); // kelas | guru | siswa
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);

    const [editGuruId, setEditGuruId] = useState("");
    const [guruDraft, setGuruDraft] = useState({ nama: "", email: "", jabatan: "" });

    const [editSiswaId, setEditSiswaId] = useState("");
    const [siswaDraft, setSiswaDraft] = useState({ nama: "" });

    const [kelasNameDraft, setKelasNameDraft] = useState("");
    const [kelasWalasDraft, setKelasWalasDraft] = useState("");
    // pastikan ini ada di atas render
    const schoolNpsn =
      (typeof profile !== "undefined" && (profile.npsn || profile.sekolahId)) ||
      (typeof user !== "undefined" && (user.npsn || user.sekolahId)) ||
      "";

    const manualLink = (s) => {
      const p = new URLSearchParams({ manual: "1" });
      if (schoolNpsn) p.set("npsn", schoolNpsn);
      if (s?.kelasId) p.set("kelas", s.kelasId);
      if (s?.id) p.set("nisn", s.id);
      return `/prayer?${p.toString()}`;
    };


    useEffect(() => {
      if (!selectedKelas) { setKelasNameDraft(""); setKelasWalasDraft(""); return; }
      const k = kelas.find(x => x.id === selectedKelas);
      setKelasNameDraft(k?.namaKelas || "");
      setKelasWalasDraft(k?.walasUid || "");
    }, [selectedKelas, kelas]);

    const downloadTemplate = () => {
      const XLSX = window.XLSX;
      if (!XLSX) return alert("XLSX (SheetJS) tidak ditemukan. Pastikan CDN ada di public/index.html");
      const wb = XLSX.utils.book_new();
      if (tab === "kelas") {
        const rows = [{ id: "XII-IPA-1", namaKelas: "XII IPA 1", tingkat: 12, jurusan: "IPA" }];
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "KelasTemplate");
      } else if (tab === "guru") {
        const rows = [{ uid: "uid123", nama: "Budi Santoso", email: "budi@sekolah.id", jabatan: "Guru BK", fotoURL: "" }];
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "GuruTemplate");
      } else {
        const rows = [{ nisn: "1234567890", nama: "Siti Aminah", kelasId: "XII-IPA-1", emailOrtu: "ibu.siti@mail.com", namaOrtu: "Ibu Siti", fotoURL: "" }];
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "SiswaTemplate");
      }
      XLSX.writeFile(wb, `template_${tab}.xlsx`);
    };

    const handleImportExcel = async (file) => {
      if (!sid || !file) return;
      setBusy(true); setProgress(0);
      try {
        const XLSX = window.XLSX;
        if (!XLSX) throw new Error("XLSX (SheetJS) tidak ditemukan. Pastikan CDN sudah ditambahkan.");
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

        const batch = writeBatch(db);
        if (tab === "kelas") {
          rows.forEach((r) => {
            const id = String(r.id || r.namaKelas || "").trim();
            if (!id) return;
            batch.set(doc(db, "sekolahtng", sid, "kelas", id), {
              namaKelas: r.namaKelas || id, tingkat: Number(r.tingkat || 0), jurusan: r.jurusan || "", updatedAt: Timestamp.now(),
            }, { merge: true });
          });
        } else if (tab === "guru") {
          rows.forEach((r) => {
            const uid = String(r.uid || "").trim(); if (!uid) return;
            batch.set(doc(db, "sekolahtng", sid, "guru", uid), {
              nama: r.nama || "", email: r.email || "", jabatan: r.jabatan || "", fotoURL: r.fotoURL || "", updatedAt: Timestamp.now(),
            }, { merge: true });
          });
        } else {
          rows.forEach((r) => {
            const nisn = String(r.nisn || "").trim(); const kelasId = String(r.kelasId || "").trim();
            if (!nisn || !kelasId) return;
            batch.set(doc(db, "sekolahtng", sid, "kelas", kelasId, "siswa", nisn), {
              nama: r.nama || "", emailOrtu: r.emailOrtu || "", namaOrtu: r.namaOrtu || "", fotoURL: r.fotoURL || "", updatedAt: Timestamp.now(),
            }, { merge: true });
          });
        }
        await batch.commit();
        alert(`Import ${tab} selesai (${rows.length} baris).`);

        // refresh
        if (tab === "kelas") {
          const snap = await getDocs(collection(db, "sekolahtng", sid, "kelas"));
          setKelas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else if (tab === "guru") {
          const snap = await getDocs(collection(db, "sekolahtng", sid, "guru"));
          setGuru(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else if (selectedKelas) {
          const snap = await getDocs(collection(db, "sekolahtng", sid, "kelas", selectedKelas, "siswa"));
           setSiswa(snap.docs.map((d) => ({ id: d.id, kelasId: selectedKelas, ...d.data() })));
        }
      } catch (e) {
        console.error(e); alert("Gagal import: " + e.message);
      } finally { setBusy(false); setProgress(0); }
    };

    // CRUD kecil2
    const addKelas = async () => {
      const id = prompt("ID Kelas (mis. XII-IPA-1)"); if (!sid || !id) return;
      const namaKelas = prompt("Nama Kelas (opsional)") || id;
      await setDoc(doc(db, "sekolahtng", sid, "kelas", id), { namaKelas, updatedAt: Timestamp.now() }, { merge: true });
      setKelas(arr => [...arr.filter(x => x.id !== id), { id, namaKelas }]);
    };
    const addGuru = async () => {
      const uid = prompt("UID Guru?"); if (!sid || !uid) return;
      const nama = prompt("Nama?") || ""; const email = prompt("Email?") || ""; const jabatan = prompt("Jabatan?") || "";
      await setDoc(doc(db, "sekolahtng", sid, "guru", uid), { nama, email, jabatan, updatedAt: Timestamp.now() }, { merge: true });
      setGuru(arr => [...arr.filter(x => x.id !== uid), { id: uid, nama, email, jabatan }]);
    };
    const addSiswa = async () => {
      const kelasId = selectedKelas || prompt("Kelas ID?"); const nisn = prompt("NISN?"); const nama = prompt("Nama?");
      if (!sid || !kelasId || !nisn) return;
      await setDoc(doc(db, "sekolahtng", sid, "kelas", kelasId, "siswa", nisn), { nama, updatedAt: Timestamp.now() }, { merge: true });
      if (kelasId === selectedKelas) setSiswa(arr => [...arr, { id: nisn, kelasId, nama }]);
    };

    const startEditGuru = (g) => { setEditGuruId(g.id); setGuruDraft({ nama: g.nama || "", email: g.email || "", jabatan: g.jabatan || "" }); };
    const saveGuru = async () => {
      if (!editGuruId) return; const id = editGuruId;
      await updateDoc(doc(db, "sekolahtng", sid, "guru", id), { ...guruDraft, updatedAt: Timestamp.now() });
      setGuru(arr => arr.map(x => x.id === id ? { ...x, ...guruDraft } : x));
      setEditGuruId(""); setGuruDraft({ nama: "", email: "", jabatan: "" });
    };
    const removeGuru = async (id) => {
      const usedBy = kelas.filter(k => k.walasUid === id);
      if (usedBy.length) { alert("Tidak bisa hapus. Guru ini masih menjadi wali di: " + usedBy.map(k => k.namaKelas || k.id).join(", ")); return; }
      if (!askConfirm("Hapus guru ini?")) return;
      await deleteDoc(doc(db, "sekolahtng", sid, "guru", id));
      setGuru(arr => arr.filter(x => x.id !== id));
    };

    const startEditSiswa = (s) => { setEditSiswaId(s.id); setSiswaDraft({ nama: s.nama || "" }); };
    const saveSiswa = async () => {
      if (!editSiswaId || !selectedKelas) return; const id = editSiswaId;
      await updateDoc(doc(db, "sekolahtng", sid, "kelas", selectedKelas, "siswa", id), { ...siswaDraft, updatedAt: Timestamp.now() });
      setSiswa(arr => arr.map(x => x.id === id ? { ...x, ...siswaDraft } : x));
      setEditSiswaId(""); setSiswaDraft({ nama: "" });
    };
    const removeSiswa = async (id) => {
      if (!selectedKelas) return; if (!askConfirm("Hapus siswa ini dari kelas?")) return;
      await deleteDoc(doc(db, "sekolahtng", sid, "kelas", selectedKelas, "siswa", id));
      setSiswa(arr => arr.filter(x => x.id !== id));
    };

    const saveKelasName = async () => {
      if (!selectedKelas) return;
      await updateDoc(doc(db, "sekolahtng", sid, "kelas", selectedKelas), { namaKelas: kelasNameDraft, updatedAt: Timestamp.now() });
      setKelas(arr => arr.map(k => k.id === selectedKelas ? { ...k, namaKelas: kelasNameDraft } : k));
      alert("Nama kelas disimpan.");
    };
    const removeKelas = async () => {
      if (!selectedKelas) return; if (!askConfirm("Hapus kelas beserta semua siswa di dalamnya?")) return;
      let batch = writeBatch(db); let count = 0;
      const siswaSnap = await getDocs(collection(db, "sekolahtng", sid, "kelas", selectedKelas, "siswa"));
      siswaSnap.forEach(docSnap => { batch.delete(docSnap.ref); count++; if (count % 400 === 0) { batch.commit(); batch = writeBatch(db); } });
      await batch.commit();
      await deleteDoc(doc(db, "sekolahtng", sid, "kelas", selectedKelas));
      setKelas(arr => arr.filter(k => k.id !== selectedKelas));
      setSiswa([]); setSelectedKelas(""); setKelasNameDraft("");
      alert("Kelas dihapus.");
    };

    const handleUploadFotoGuru = async (g) => {
      const file = await pickImage(); if (!file) return; setBusy(true);
      try {
        const url = await uploadImageAndGetURL(file, `foto_sekolah/${sid}/guru/${g.id}.jpg`, setProgress);
        await updateDoc(doc(db, "sekolahtng", sid, "guru", g.id), { fotoURL: url, updatedAt: Timestamp.now() });
        setGuru(arr => arr.map(x => x.id === g.id ? { ...x, fotoURL: url } : x));
      } catch (e) { alert(e.message); } finally { setBusy(false); setProgress(0); }
    };
    const handleUploadFotoSiswa = async (s) => {
      const file = await pickImage(); if (!file || !selectedKelas) return; setBusy(true);
      try {
        const url = await uploadImageAndGetURL(file, `foto_sekolah/${sid}/siswa/${s.id}.jpg`, setProgress);
        await updateDoc(doc(db, "sekolahtng", sid, "kelas", selectedKelas, "siswa", s.id), { fotoURL: url, updatedAt: Timestamp.now() });
        setSiswa(arr => arr.map(x => x.id === s.id ? { ...x, fotoURL: url } : x));
      } catch (e) { alert(e.message); } finally { setBusy(false); setProgress(0); }
    };

    const saveWaliKelas = async () => {
      if (!selectedKelas) return;
      const nama = guru.find(g => g.id === kelasWalasDraft)?.nama || "";
      await updateDoc(doc(db, "sekolahtng", sid, "kelas", selectedKelas), {
        walasUid: kelasWalasDraft || null,
        walasNama: nama,
        updatedAt: Timestamp.now(),
      });
      setKelas(arr => arr.map(k => k.id === selectedKelas ? { ...k, walasUid: kelasWalasDraft || null, walasNama: nama } : k));
      alert("Wali kelas disimpan.");
    };

    async function pickImage() {
      return await new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file"; input.accept = "image/*";
        input.onchange = () => resolve(input.files?.[0] || null);
        input.click();
      });
    }

    return (
      <section className={CARD}>
        <div className={HSEC}>
          <h3 className="text-lg font-semibold">Manajemen Data</h3>
          {busy && (
            <span className="text-sm text-slate-500">Upload/Import… {progress}%</span>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {["kelas", "guru", "siswa"].map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                tab === k ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              aria-label={k}
              title={k.toUpperCase()}
            >
              <span className="inline-flex">{TAB_ICONS[k]}</span>
              <span className="font-medium">{k.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* Toolbar umum */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {tab === "siswa" && (
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
            >
              <option value="">-- Pilih Kelas --</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>{k.namaKelas || "(tanpa nama kelas)"}</option>
              ))}
            </select>
          )}

          <button
            onClick={tab === "kelas" ? addKelas : tab === "guru" ? addGuru : addSiswa}
            className={BTN.primary}
          >
            + Tambah {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>

          <button onClick={downloadTemplate} className={BTN.ghost}>Download Template Excel</button>

          <label className={`${BTN.ghost} cursor-pointer`}>
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleImportExcel(e.target.files?.[0])}
            />
          </label>
        </div>

        {/* === KELAS === */}
        {tab === "kelas" && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {kelas.map((k) => {
                const isSel = selectedKelas === k.id;
                return (
                  <button
                    key={k.id}
                    onClick={() => setSelectedKelas(k.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      isSel ? "border-slate-900 shadow" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-base font-semibold">{k.namaKelas || "(tanpa nama kelas)"}</div>
                    {k.walasNama && (
                      <div className="text-xs text-slate-500">Wali: {k.walasNama}</div>
                    )}
                    <div className="mt-1 text-xs text-slate-400">{isSel ? "Dipilih" : "Klik untuk kelola"}</div>
                  </button>
                );
              })}
              {!kelas.length && <div className="text-slate-600">Belum ada data kelas.</div>}
            </div>

            {selectedKelas && (
              <div className="mt-4 rounded-xl border border-slate-200 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <strong>Kelola Kelas:</strong>
                  <span className="text-slate-600">{selectedKelas}</span>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <input
                    value={kelasNameDraft}
                    onChange={(e) => setKelasNameDraft(e.target.value)}
                    placeholder="Nama Kelas"
                    className="min-w-[220px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                  />
                  <button onClick={saveKelasName} className={BTN.primary}>
                    <span className="mr-1 inline-flex">{ACTION_ICONS.check}</span> Simpan Nama
                  </button>
                  <button onClick={removeKelas} className={BTN.danger}>Hapus Kelas</button>
                </div>

                {/* Wali Kelas */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <select
                    value={kelasWalasDraft}
                    onChange={(e) => setKelasWalasDraft(e.target.value)}
                    className="min-w-[220px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                  >
                    <option value="">-- Pilih Wali Kelas --</option>
                    {guru.map((g) => (
                      <option key={g.id} value={g.id}>{g.nama || g.id}</option>
                    ))}
                  </select>
                  <button onClick={saveWaliKelas} className={BTN.ghost}>Simpan Wali</button>
                  {kelasWalasDraft && (
                    <span className="text-xs text-slate-500">
                      Terpilih: {guru.find((g) => g.id === kelasWalasDraft)?.nama || kelasWalasDraft}
                    </span>
                  )}
                </div>

                <div className="mb-2 font-semibold">Siswa di kelas ini</div>
                <div className="grid gap-2">
                  {siswa.map((s) => {
                    const editing = editSiswaId === s.id;
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-2">
                        <div className="flex flex-1 items-center gap-3">
                          <Avatar url={s.fotoURL} />
                          <div className="min-w-0">
                            {!editing ? (
                              <>
                                <div className="truncate text-sm font-semibold">{s.nama || s.id}</div>
                                <div className="text-xs text-slate-500">NISN: {s.id}</div>
                              </>
                            ) : (
                              <input
                                value={siswaDraft.nama}
                                onChange={(e) => setSiswaDraft((v) => ({ ...v, nama: e.target.value }))}
                                placeholder="Nama siswa"
                                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                              />
                            )}
                          </div>
                        </div>
                        {!editing ? (
                          <div className="inline-flex items-center gap-2">
                            <IconButton title="Edit Siswa" onClick={() => startEditSiswa(s)}>{ACTION_ICONS.edit}</IconButton>
                            <IconButton title="Upload Foto Siswa" onClick={() => handleUploadFotoSiswa(s)}>{ACTION_ICONS.photo}</IconButton>
                            <IconButton title="Hapus Siswa" danger onClick={() => removeSiswa(s.id)}>{ACTION_ICONS.delete}</IconButton>
                          <Link
                          className="btn-primary btn-sm"
                          to={manualLink(s)}
                          title="Entri Manual Ibadah"
                        >
                          Entri Manual
                        </Link>


                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button onClick={saveSiswa} className={BTN.primary}><span className="mr-1 inline-flex">{ACTION_ICONS.check}</span> Simpan</button>
                            <button onClick={() => { setEditSiswaId(""); setSiswaDraft({ nama: "" }); }} className={BTN.ghost}><span className="mr-1 inline-flex">{ACTION_ICONS.close}</span> Batal</button>
                         <td className="whitespace-nowrap px-3 py-2 text-right">
                          <td className="whitespace-nowrap px-3 py-2 text-right">
                        
                      </td>
                                          


                      </td>

                          </div>
                          
                        )}
                      </div>
                    );
                  })}
                  {!siswa.length && <div className="text-slate-600">Belum ada siswa di kelas ini.</div>}
                </div>
              </div>
            )}
          </>
        )}

        {/* === GURU === */}
        {tab === "guru" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guru.map((g) => {
              const editing = editGuruId === g.id;
              return (
                <div key={g.id} className="flex items-start justify-between rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-1 items-start gap-3">
                    <Avatar url={g.fotoURL} />
                    <div className="min-w-0">
                      {!editing ? (
                        <>
                          <div className="truncate text-sm font-semibold">{g.nama || "(tanpa nama)"}</div>
                          <div className="text-xs text-slate-500">{g.email || "-"}</div>
                          {g.jabatan && <div className="text-xs text-slate-500">Jabatan: {g.jabatan}</div>}
                        </>
                      ) : (
                        <div className="grid gap-2">
                          <input value={guruDraft.nama} onChange={(e) => setGuruDraft((v) => ({ ...v, nama: e.target.value }))} placeholder="Nama" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
                          <input value={guruDraft.email} onChange={(e) => setGuruDraft((v) => ({ ...v, email: e.target.value }))} placeholder="Email" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
                          <input value={guruDraft.jabatan} onChange={(e) => setGuruDraft((v) => ({ ...v, jabatan: e.target.value }))} placeholder="Jabatan" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
                        </div>
                      )}
                    </div>
                  </div>
                  {!editing ? (
                    <div className="inline-flex items-center gap-2">
                      <IconButton title="Edit Guru" onClick={() => startEditGuru(g)}>{ACTION_ICONS.edit}</IconButton>
                      <IconButton title="Upload Foto Guru" onClick={() => handleUploadFotoGuru(g)}>{ACTION_ICONS.photo}</IconButton>
                      <IconButton title="Hapus Guru" danger onClick={() => removeGuru(g.id)}>{ACTION_ICONS.delete}</IconButton>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2">
                      <button onClick={saveGuru} className={BTN.primary}><span className="mr-1 inline-flex">{ACTION_ICONS.check}</span> Simpan</button>
                      <button onClick={() => { setEditGuruId(""); setGuruDraft({ nama: "", email: "", jabatan: "" }); }} className={BTN.ghost}><span className="mr-1 inline-flex">{ACTION_ICONS.close}</span> Batal</button>
                    </div>
                  )}
                </div>
              );
            })}
            {!guru.length && <div className="text-slate-600">Belum ada data guru.</div>}
          </div>
        )}

        {/* === SISWA (view by kelas) === */}
        {tab === "siswa" && (
          <>
            {!selectedKelas && (
              <div className="text-slate-600">Pilih kelas terlebih dahulu untuk melihat siswa.</div>
            )}

            {selectedKelas && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {siswa.map((s) => {
                  const editing = editSiswaId === s.id;
                  return (
                    <div key={s.id} className="flex items-start justify-between rounded-xl border border-slate-200 p-3">
                      <div className="flex flex-1 items-start gap-3">
                        <Avatar url={s.fotoURL} />
                        <div className="min-w-0">
                          {!editing ? (
                            <>
                              <div className="truncate text-sm font-semibold">{s.nama || s.id}</div>
                              <div className="text-xs text-slate-500">NISN: {s.id}</div>
                            </>
                          ) : (
                            <input
                              value={siswaDraft.nama}
                              onChange={(e) => setSiswaDraft((v) => ({ ...v, nama: e.target.value }))}
                              placeholder="Nama siswa"
                              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                            />
                          )}
                        </div>
                      </div>

                      {!editing ? (
                        <div className="inline-flex items-center gap-2">
                          <IconButton title="Edit Siswa" onClick={() => startEditSiswa(s)}>{ACTION_ICONS.edit}</IconButton>
                          <IconButton title="Upload Foto Siswa" onClick={() => handleUploadFotoSiswa(s)}>{ACTION_ICONS.photo}</IconButton>
                          <Link to={manualLink(s)} className="btn-ghost px-2 py-1 text-xs" title="Entri Manual Ibadah">
                        Entri Manual
                      </Link>

                          <IconButton title="Hapus Siswa" danger onClick={() => removeSiswa(s.id)}>{ACTION_ICONS.delete}</IconButton>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button onClick={saveSiswa} className={BTN.primary}>
                            <span className="mr-1 inline-flex">{ACTION_ICONS.check}</span> Simpan
                          </button>
                          <button
                            onClick={() => { setEditSiswaId(""); setSiswaDraft({ nama: "" }); }}
                            className={BTN.ghost}
                          >
                            <span className="mr-1 inline-flex">{ACTION_ICONS.close}</span> Batal
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!siswa.length && <div className="text-slate-600">Tidak ada siswa di kelas ini.</div>}
              </div>
            )}
          </>
        )}
        
         </section> ); };




  /* --------------------------- Section: Rekap --------------------------- */
  const SectionRekap = () => (
    <section className={CARD}>
      <h3 className="mb-3 text-lg font-semibold">Rekap Ibadah</h3>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={selectedKelas}
          onChange={(e) => setSelectedKelas(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">-- Pilih Kelas --</option>
          {kelas.map((k) => (
            <option key={k.id} value={k.id}>{k.namaKelas || k.id}</option>
          ))}
        </select>

        {selectedKelas && (
          <select
            value={selectedSiswa}
            onChange={(e) => setSelectedSiswa(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">-- Pilih Siswa --</option>
            {siswa.map((s) => (
              <option key={s.id} value={s.id}>{s.nama || s.id}</option>
            ))}
          </select>
        )}
      </div>

      {selectedKelas && selectedSiswa ? (
        <RecapIbadahDashboard sekolahId={sid} kelasId={selectedKelas} nisn={selectedSiswa} />
      ) : (
        <div className="text-slate-600">Pilih kelas dan siswa untuk melihat rekap.</div>
      )}
    </section>
  );




  /* ----------------------------- Render Page ---------------------------- */
  return (
    <>
      <Topbar
        user={user}
        profile={profile}
        title="Admin Sekolah"
        school={{
     name: sekolahInfo?.sekolah || "",
     logoURL: sekolahInfo?.logoURL || "",
     logoUrl:  sekolahInfo?.logoURL || ""
   }}
      />

      {/* Layout with sidebar */}
      <div className={`grid min-h-[calc(100vh-56px)] grid-cols-[240px_1fr] bg-slate-50 md:grid-cols-[${collapsed ? "72px" : "240px"}_1fr]`}>
        {/* Sidebar */}
        <aside className={`sticky top-14 h-[calc(100vh-56px)] overflow-hidden border-r border-slate-200 bg-white px-3 py-3 ${collapsed ? "w-[72px]" : "w-[240px]"}`}>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            {!collapsed && <span>Menu</span>}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={`${BTN.ghost} ml-auto h-7 w-7 p-0 text-xs`}
              aria-label={collapsed ? "Perluas menu" : "Persempit menu"}
              title={collapsed ? "Perluas menu" : "Persempit menu"}
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>
          <nav className="grid gap-2">
            {MENU.map((item) => {
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  } ${collapsed ? "justify-center px-0" : "justify-start"}`}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <span className="inline-flex">{ICONS[item.key] || "•"}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="grid gap-4 p-4">
          {!sid && (
            <div className={CARD}>Data sekolah belum lengkap. Hubungi Super Admin.</div>
          )}
          {sid && (
            <>
              {active === "profil" && <SectionProfil />}
              {active === "data" && <SectionData />}
              {active === "rekap" && <SectionRekap />}
            </>
          )}
        </main>
      </div>
    </>
  );
}
