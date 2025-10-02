import React, { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

export default function ChangePasswordDialog({ user, onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (next.length < 6) { alert("Password baru minimal 6 karakter."); return; }
    if (next !== confirm) { alert("Konfirmasi password tidak cocok."); return; }
    try {
      setSaving(true);
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, next);
      alert("Password berhasil diubah.");
      onClose();
    } catch (e) {
      console.error(e);
      alert("Gagal mengubah password. Pastikan password saat ini benar.");
    } finally { setSaving(false); }
  };

  return (
    <div style={m.backdrop}>
      <div style={m.card}>
        <h3>Ubah Password</h3>
        <input type="password" placeholder="Password saat ini" value={current} onChange={e=>setCurrent(e.target.value)} />
        <input type="password" placeholder="Password baru" value={next} onChange={e=>setNext(e.target.value)} />
        <input type="password" placeholder="Ulangi password baru" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}>
          <button onClick={onClose}>Batal</button>
          <button onClick={submit} disabled={saving}>{saving?"Menyimpan…":"Simpan"}</button>
        </div>
      </div>
    </div>
  );
}
const m = {
  backdrop:{position:"fixed",inset:0,background:"rgba(0,0,0,.15)",display:"flex",alignItems:"center",justifyContent:"center"},
  card:{background:"#fff",padding:16,borderRadius:12,minWidth:340,boxShadow:"0 10px 30px rgba(0,0,0,.1)",display:"grid",gap:8}
};
