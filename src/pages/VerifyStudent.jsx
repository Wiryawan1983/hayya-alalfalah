import React, { useState } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export default function VerifyStudent() {
  const [npsn, setNpsn] = useState("");
  const [nisn, setNisn] = useState("");
  const [tgl, setTgl]   = useState(""); // YYYY-MM-DD
  const [msg, setMsg]   = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const functions = getFunctions(); // set region jika perlu

  const canSubmit = npsn.trim() && nisn.trim() && tgl.trim();

  const link = async () => {
    if (!canSubmit || busy) return;
    try {
      setBusy(true);
      setMsg("Memverifikasi…");

      const callable = httpsCallable(functions, "linkStudentAccount");
      const res = await callable({ npsn: npsn.trim(), nisn: nisn.trim(), tglLahir: tgl.trim() });
      const data = res?.data || {};

      // on success, simpan pointer agar dashboard nyambung
      const u = auth.currentUser;
      if (u?.uid) {
        await setDoc(
          doc(db, "users", u.uid),
          {
            sekolahId: data.sekolahId || npsn.trim(),
            idKelas:   data.kelasId || data.kelas || null,
            nisn:      nisn.trim(),
            verifiedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      setMsg(data?.message || "Berhasil. Akunmu tertaut ke data sekolah.");
    } catch (e) {
      // Jika tidak ditemukan → arahkan ke register dengan pra-isi (role siswa)
      const txt = String(e?.message || e?.code || "");
      const notFound =
        /not\s*found|data.*(tidak|nggak).*ditemukan|SISWA_TIDAK_DITEMUKAN|NOT_FOUND/i.test(txt);
      if (notFound) {
        setMsg("Data belum ada. Mengalihkan ke halaman Registrasi…");
        // kirim pra-isi agar form register otomatis terisi
        const params = new URLSearchParams({
          role: "siswa",
          npsn: npsn.trim(),
          nisn: nisn.trim(),
          tgl:  tgl.trim(),
        });
        navigate(`/register?${params.toString()}`);
        return;
      }
      setMsg(txt || "Gagal memverifikasi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{maxWidth:420, margin:"40px auto"}}>
      <h2>Verifikasi Siswa</h2>

      <input value={npsn} onChange={(e)=>setNpsn(e.target.value)} placeholder="NPSN / ID Sekolah"
             style={{width:"100%",padding:10,marginTop:8}} />

      <input value={nisn} onChange={(e)=>setNisn(e.target.value)} placeholder="NISN"
             style={{width:"100%",padding:10,marginTop:8}} />

      <input type="date" value={tgl} onChange={(e)=>setTgl(e.target.value)}
             style={{width:"100%",padding:10,marginTop:8}} />

      <button onClick={link} disabled={!canSubmit || busy} style={{marginTop:10}}>
        {busy ? "Memverifikasi…" : "Tautkan"}
      </button>

      {msg && <p style={{marginTop:10}}>{msg}</p>}
    </div>
  );
}
