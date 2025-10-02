// src/pages/Register.jsx — Tailwind version (HARDENED & FIXED)
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, doc, getDocs, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  EmailAuthProvider,
  linkWithCredential,
} from "firebase/auth";

const ROLES_UI = ["Admin Sekolah", "Wali Kelas", "Siswa", "Orang Tua"];
const mapRole = (r) => {
  switch (r) {
    case "Admin Sekolah": return "admin_sekolah";
    case "Wali Kelas":    return "walas";
    case "Siswa":         return "siswa";
    case "Orang Tua":     return "ortu";
    default:               return "";
  }
};

export default function Register() {
  // Data master & pilihan
  const [provinsiList, setProvinsiList]   = useState([]);
  const [kabupatenList, setKabupatenList] = useState([]);
  const [kecamatanList, setKecamatanList] = useState([]);
  const [sekolahList, setSekolahList]     = useState([]);
  const [kelasList, setKelasList]         = useState([]);
  const [siswaList, setSiswaList]         = useState([]);

  // Nilai yang dipilih user
  const [provinsi, setProvinsi]   = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [npsn, setNpsn]           = useState("");
  const [kelasId, setKelasId]     = useState("");
  const [nisn, setNisn]           = useState("");
  const [roleUI, setRoleUI]       = useState("");

  // Akun
  const [nama, setNama]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);

  // Tambah sekolah (khusus Admin Sekolah)
  const [addNewSchool, setAddNewSchool] = useState(false);
  const [newSchool, setNewSchool] = useState({
    namaSekolah: "",
    npsn: "",
    propinsi: "",
    kabupaten_kota: "",
    kecamatan: "",
    alamat_jalan: ""
  });

  // UI feedback
  const [err, setErr]   = useState("");
  const [ok,  setOk]    = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const isAdminUI = mapRole(roleUI) === "admin_sekolah";

  // Reset mode tambah sekolah jika bukan admin
  useEffect(() => {
    if (!isAdminUI && addNewSchool) setAddNewSchool(false);
  }, [isAdminUI, addNewSchool]);

  // Load daftar sekolah sekali
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "sekolahtng"));
        if (!mounted) return;
        const data = snap.docs.map((d) => {
          const v = d.data() || {};
          return {
            id: d.id,
            npsn: v.npsn || d.id,
            propinsi: v.propinsi || v.provinsi || "",
            kabupaten_kota: v.kabupaten_kota || v.kabupaten || "",
            kecamatan: v.kecamatan || "",
            namaSekolah: v.sekolah || v.namaSekolah || "",
          };
        });
        setSekolahList(data);
        setProvinsiList([...new Set(data.map((s) => s.propinsi).filter(Boolean))]);
      } catch (e) {
        console.error("Load sekolahtng error:", e);
        setErr("Gagal memuat daftar sekolah. Pastikan rules Firestore izinkan read pada 'sekolahtng'.");
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Prefill email jika user sudah login
  useEffect(() => {
    const u = auth.currentUser;
    if (u?.email) setEmail(u.email);
  }, []);

  /* ---------- Handlers (useCallback + guards) ---------- */
  const handleProvinsiChange = useCallback((p) => {
    if (p === provinsi) return;
    setProvinsi(p);
    setKabupaten(""); setKecamatan(""); setNpsn("");
    setKelasList([]); setSiswaList([]); setAddNewSchool(false);

    const kab = (sekolahList || [])
      .filter((s) => s.propinsi === p)
      .map((s) => s.kabupaten_kota)
      .filter(Boolean);

    const uniqKab = [...new Set(kab)];
    if (JSON.stringify(uniqKab) !== JSON.stringify(kabupatenList || [])) {
      setKabupatenList(uniqKab);
    }
    if (kecamatanList.length) setKecamatanList([]);
  }, [provinsi, sekolahList, kabupatenList, kecamatanList]);

  const handleKabupatenChange = useCallback((k) => {
    if (k === kabupaten) return;
    setKabupaten(k);
    setKecamatan(""); setNpsn("");
    setKelasList([]); setSiswaList([]); setAddNewSchool(false);

    const kec = (sekolahList || [])
      .filter((s) => s.propinsi === provinsi && s.kabupaten_kota === k)
      .map((s) => s.kecamatan)
      .filter(Boolean);

    const uniqKec = [...new Set(kec)];
    if (JSON.stringify(uniqKec) !== JSON.stringify(kecamatanList || [])) {
      setKecamatanList(uniqKec);
    }
  }, [provinsi, sekolahList, kabupaten, kecamatanList]);

  const handleKecamatanChange = useCallback((kc) => {
    if (kc === kecamatan) return;
    setKecamatan(kc);
    setNpsn("");
    setKelasList([]); setSiswaList([]); setAddNewSchool(false);
  }, [kecamatan]);

  const handleSekolahChange = useCallback(async (id) => {
    if (id === npsn) return;
    setNpsn(id);
    setAddNewSchool(false);
    setKelasList([]); setSiswaList([]);
    if (mapRole(roleUI) === "siswa" && id) {
      try {
        const kelasSnap = await getDocs(collection(db, "sekolahtng", id, "kelas"));
        const kelasData = kelasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setKelasList(kelasData);
      } catch (e) {
        console.error("Load kelas error:", e);
        setErr("Gagal memuat kelas dari sekolah ini.");
      }
    }
  }, [npsn, roleUI]);

  const handleKelasChange = useCallback(async (kid) => {
    if (kid === kelasId) return;
    setKelasId(kid);
    try {
      if (!npsn || !kid) {
        setSiswaList([]);
        return;
      }
      const siswaSnap = await getDocs(collection(db, "sekolahtng", npsn, "kelas", kid, "siswa"));
      const siswaData = siswaSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSiswaList(siswaData);
    } catch (e) {
      console.error("Load siswa error:", e);
      setErr("Gagal memuat daftar siswa.");
    }
  }, [npsn, kelasId]);

  // Validasi sekolah baru
  const validateNewSchool = useCallback(() => {
    const payload = {
      sekolah: (newSchool.namaSekolah || "").trim(),
      npsn: (newSchool.npsn || "").trim(),
      propinsi: (newSchool.propinsi || provinsi).trim(),
      kabupaten_kota: (newSchool.kabupaten_kota || kabupaten).trim(),
      kecamatan: (newSchool.kecamatan || kecamatan).trim(),
      alamat_jalan: (newSchool.alamat_jalan || "").trim(),
    };
    if (!payload.sekolah || !payload.propinsi || !payload.kabupaten_kota || !payload.kecamatan) {
      throw new Error("Lengkapi nama sekolah, provinsi, kabupaten/kota, kecamatan.");
    }
    return payload;
  }, [newSchool, provinsi, kabupaten, kecamatan]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr(""); setOk(""); setBusy(true);

    try {
      const role = mapRole(roleUI);
      if (!role) throw new Error("Role belum dipilih.");
      if (!addNewSchool && (!provinsi || !kabupaten || !npsn)) {
        throw new Error("Provinsi/Kabupaten/Sekolah wajib diisi.");
      }
      if (role === "siswa" && (!kelasId || !nisn) && !addNewSchool) {
        throw new Error("Untuk siswa, pilih kelas dan NISN.");
      }

      let uid;
      const current = auth.currentUser;

      if (current) {
        // === SUDAH LOGIN ===
        uid = current.uid;

        // (opsional) Link password ke akun yg sama
        const providers = (current.providerData || []).map(p => p.providerId);
        if (!providers.includes("password")) {
          if (email !== current.email) {
            throw new Error("Email pendaftaran harus sama dengan email login saat ini.");
          }
          if (password && password.length >= 6) {
            try {
              const cred = EmailAuthProvider.credential(email, password);
              await linkWithCredential(current, cred);
            } catch (e) {
              if (e.code === "auth/credential-already-in-use" || e.code === "auth/email-already-in-use") {
                // abaikan: sudah pernah di-link
              } else if (e.code === "auth/requires-recent-login") {
                throw new Error("Keamanan: mohon login ulang lalu setel password lagi.");
              } else {
                throw e;
              }
            }
          }
        }

        // set displayName (opsional)
        if (nama && !current.displayName) {
          await updateProfile(current, { displayName: nama });
        }
      } else {
        // === BELUM LOGIN → buat akun baru ===
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        if (nama) await updateProfile(cred.user, { displayName: nama });
      }

      // === Tulis dokumen profil Firestore ===
      const userDoc = {
        email,
        displayName: nama || auth.currentUser?.displayName || "",
        role,
        sekolahId: addNewSchool ? null : (npsn || null),
        idKelas: role === "siswa" ? (addNewSchool ? null : kelasId) : null,
        nisn: role === "siswa" ? (addNewSchool ? null : nisn) : null,
        createdAt: new Date(),
        pending_sekolah: addNewSchool || false,
      };
      await setDoc(doc(db, "users", uid), userDoc, { merge: true });

      // === Tautkan siswa ke kelas (jika perlu) ===
      if (!addNewSchool && role === "siswa" && nisn) {
        await setDoc(
          doc(db, "sekolahtng", npsn, "kelas", kelasId, "siswa", nisn),
          { userId: uid, nama: nama || "", email },
          { merge: true }
        );
      }

      // === Request sekolah baru (admin) ===
      if (addNewSchool && mapRole(roleUI) === "admin_sekolah") {
        const payload = validateNewSchool();
        await addDoc(collection(db, "sekolahtng_requests"), {
          ...payload,
          status: "pending",
          requestedBy: uid,
          createdAt: serverTimestamp(),
        });
        setOk("Akun Admin dibuat. Permohonan sekolah terkirim, menunggu verifikasi.");
      } else {
        setOk("Registrasi berhasil! Mengalihkan ke login…");
      }

      setTimeout(() => navigate("/login"), 1400);
    } catch (e) {
      console.error("Register error:", e);
      if (e.code === "auth/email-already-in-use") {
        setErr("Email sudah terdaftar. Silakan login, lalu lengkapi profil.");
      } else if (e.code === "auth/weak-password") {
        setErr("Password terlalu lemah. Gunakan minimal 6 karakter.");
      } else {
        setErr(e.message || "Gagal registrasi.");
      }
    } finally {
      setBusy(false);
    }
  }; // ← penting: tutup dengan ; agar tidak error

  const sekolahFiltered = useMemo(() => (
    (sekolahList || []).filter((s) =>
      s.propinsi === provinsi &&
      s.kabupaten_kota === kabupaten &&
      (kecamatan ? s.kecamatan === kecamatan : true)
    )
  ), [sekolahList, provinsi, kabupaten, kecamatan]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-4xl grid gap-6 md:grid-cols-5">
        {/* LEFT */}
        <aside className="md:col-span-2 hidden md:flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-lg font-semibold">Buat Akun</h1>
            <p className="text-slate-600 text-sm">Aplikasi Pencatatan Sholat</p>
          </div>
          {err ? <Alert variant="error" message={err} /> : null}
          {ok ? <Alert variant="success" message={ok} /> : null}
        </aside>

        {/* RIGHT: Form */}
        <form onSubmit={handleRegister} className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {/* Role chips */}
          <div>
            <Label>Peran</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {ROLES_UI.map((r) => {
                const active = roleUI === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleUI(r)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${active ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lokasi & Sekolah */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Provinsi" value={provinsi} onChange={(e)=>handleProvinsiChange(e.target.value)} required>
              <option value="">-- Pilih Provinsi --</option>
              {provinsiList.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Select label="Kabupaten/Kota" value={kabupaten} onChange={(e)=>handleKabupatenChange(e.target.value)} required>
              <option value="">-- Pilih Kabupaten --</option>
              {kabupatenList.map((k) => <option key={k} value={k}>{k}</option>)}
            </Select>
            <Select label="Kecamatan" value={kecamatan} onChange={(e)=>handleKecamatanChange(e.target.value)} required>
              <option value="">-- Pilih Kecamatan --</option>
              {kecamatanList.map((kc) => <option key={kc} value={kc}>{kc}</option>)}
            </Select>
            <div>
              <Label>Sekolah</Label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={addNewSchool ? "__NEW__" : npsn}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "__NEW__") {
                    if (isAdminUI) { setAddNewSchool(true); setNpsn(""); }
                  } else {
                    handleSekolahChange(val);
                  }
                }}
                required={!addNewSchool}
              >
                <option value="">-- Pilih Sekolah --</option>
                {sekolahFiltered.map((s) => (
                  <option key={s.id} value={s.id}>{s.namaSekolah} ({s.npsn})</option>
                ))}
                {isAdminUI && <option value="__NEW__">+ Tambah Sekolah Baru…</option>}
              </select>
            </div>
          </div>

          {/* Tambah sekolah baru (Admin) */}
          {isAdminUI && addNewSchool && (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-3">
              <p className="text-sm font-semibold">Input Sekolah Baru</p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Nama Sekolah" value={newSchool.namaSekolah} onChange={(e)=>setNewSchool(s=>({...s,namaSekolah:e.target.value}))} required />
                <Input label="NPSN (opsional)" value={newSchool.npsn} onChange={(e)=>setNewSchool(s=>({...s,npsn:e.target.value}))} />
                <Input label="Provinsi" value={newSchool.propinsi || provinsi} onChange={(e)=>setNewSchool(s=>({...s,propinsi:e.target.value}))} required />
                <Input label="Kabupaten/Kota" value={newSchool.kabupaten_kota || kabupaten} onChange={(e)=>setNewSchool(s=>({...s,kabupaten_kota:e.target.value}))} required />
                <Input label="Kecamatan" value={newSchool.kecamatan || kecamatan} onChange={(e)=>setNewSchool(s=>({...s,kecamatan:e.target.value}))} required />
                <Input label="Alamat Jalan" value={newSchool.alamat_jalan} onChange={(e)=>setNewSchool(s=>({...s,alamat_jalan:e.target.value}))} />
              </div>
            </div>
          )}

          {/* Khusus siswa */}
          {mapRole(roleUI) === "siswa" && !addNewSchool && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select label="Kelas" value={kelasId} onChange={(e)=>handleKelasChange(e.target.value)} required>
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map((k) => <option key={k.id} value={k.id}>{k.namaKelas || k.id}</option>)}
              </Select>
              <Select label="Nama Siswa (NISN)" value={nisn} onChange={(e)=>setNisn(e.target.value)} required>
                <option value="">-- Pilih Nama Siswa --</option>
                {siswaList.map((s) => <option key={s.id} value={s.id}>{s.nama || s.id}</option>)}
              </Select>
            </div>
          )}

          {/* Akun */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Nama Lengkap" value={nama} onChange={(e)=>setNama(e.target.value)} required />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
              disabled={!!auth.currentUser}
            />
            <div className="md:col-span-2">
              <Label>Password</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  required={!auth.currentUser}  // ← wajib hanya jika belum login
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="••••••••"
                />
                <button type="button" onClick={()=>setShowPwd(v=>!v)} className="btn-ghost">
                  {showPwd ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
            </div>
          </div>

          {/* Submit + error */}
          <div className="mt-5 flex items-center justify-between">
            <div className="text-xs text-slate-500">Dengan mendaftar, Anda menyetujui ketentuan penggunaan.</div>
            <button type="submit" disabled={busy} className={`btn-primary ${busy ? "opacity-70" : ""}`}>
              {busy ? "Memproses…" : "Register"}
            </button>
          </div>

          {/* Alerts on mobile */}
          <div className="mt-3 md:hidden">
            {err ? <Alert variant="error" message={err} /> : null}
            {ok ? <Alert variant="success" message={ok} /> : null}
          </div>

          {/* Error inline */}
          {err && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {err}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

/* ===== Reusable bits ===== */
function Label({ children }) {
  return <label className="text-sm font-medium text-slate-700">{children}</label>;
}
function Input({ label, className="", ...props }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        {...props}
        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
      />
    </div>
  );
}
function Select({ label, className="", children, ...props }) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        {...props}
        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
      >
        {children}
      </select>
    </div>
  );
}
function Alert({ variant = "info", message }) {
  const tone = variant === "error" ? "bg-red-50 text-red-700 border-red-200"
             : variant === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
             : "bg-slate-50 text-slate-700 border-slate-200";
  return <div className={`rounded-xl border px-3 py-2 text-sm ${tone}`}>{message}</div>;
}
