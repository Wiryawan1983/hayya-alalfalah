import React, { useState } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import { db } from "../firebase";
import { doc } from "firebase/firestore";

export default function Invite() {
  const [siswaRef, setSiswaRef] = useState(""); // path anchor siswa
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const functions = getFunctions();

  const createInvite = async () => {
    try {
      setBusy(true); setMsg("");
      // validasi path
      if (!siswaRef.startsWith("sekolahtng/")) {
        setMsg("Isi path lengkap siswa (mulai dgn sekolahtng/...)");
        setBusy(false); return;
      }
      const callable = httpsCallable(functions, "createInvite");
      const res = await callable({ siswaRef });
      setCode(res.data.code);
      setMsg(`Kode berlaku s/d ${new Date(res.data.expiredAt).toLocaleString()}`);
    } catch (e) {
      setMsg(e.message || "Gagal membuat kode");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{maxWidth:560, margin:"40px auto"}}>
      <h2>Buat Kode Undangan (6 digit)</h2>
      <p className="hint">Masukkan <code>path</code> dokumen siswa, contoh:<br/>
        <code>sekolahtng/NPSN/kelas/KELAS_ID/siswa/NISN</code>
      </p>
      <input
        value={siswaRef}
        onChange={(e)=>setSiswaRef(e.target.value)}
        placeholder="sekolahtng/..."
        style={{width:"100%",padding:10,marginTop:8}}
      />
      <button onClick={createInvite} disabled={busy || !siswaRef} style={{marginTop:10}}>
        {busy ? "Memproses..." : "Generate"}
      </button>
      {code && (
        <div style={{marginTop:16, fontSize:28, fontFamily:"monospace", letterSpacing:6}}>
          {code}
        </div>
      )}
      {msg && <p style={{marginTop:10}}>{msg}</p>}
    </div>
  );
}
