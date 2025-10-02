import React, { useState } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";

export default function Redeem() {
  const [code, setCode] = useState("");
  const [nama, setNama] = useState("");
  const [hp, setHp] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const functions = getFunctions();

  const redeem = async () => {
    try {
      setMsg("Memproses..."); setOk(false);
      const callable = httpsCallable(functions, "claimInvite");
      const res = await callable({ code, ortuNama: nama, ortuHp: hp });
      setMsg("Berhasil! Anak ditautkan.");
      setOk(true);
    } catch (e) {
      setMsg(e.message || "Gagal klaim kode");
    }
  };

  return (
    <div style={{maxWidth:420, margin:"40px auto"}}>
      <h2>Redeem Kode 6 Digit</h2>
      <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="123456"
             style={{width:"100%",padding:10,marginTop:8,fontFamily:"monospace",letterSpacing:6}} />
      <input value={nama} onChange={(e)=>setNama(e.target.value)} placeholder="Nama Orang Tua"
             style={{width:"100%",padding:10,marginTop:8}} />
      <input value={hp} onChange={(e)=>setHp(e.target.value)} placeholder="HP Orang Tua"
             style={{width:"100%",padding:10,marginTop:8}} />
      <button onClick={redeem} disabled={!code} style={{marginTop:10}}>Klaim</button>
      {msg && <p style={{marginTop:10, color: ok ? "green":"crimson"}}>{msg}</p>}
    </div>
  );
}
