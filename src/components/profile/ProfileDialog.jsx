import React, { useState } from "react";
import { db } from "../../firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { uploadUserPhoto } from "../../lib/storageUpload";

export default function ProfileDialog({ user, profile, onClose }) {
  const role = profile?.role;
  const [form, setForm] = useState(()=>({
    displayName: profile?.displayName || "",
    phone: profile?.phone || "",
    // admin sekolah bisa edit profil sekolah
    sekolahNama: profile?.sekolahNama || "",
    // walas: idKelas sudah di user, edit opsional label
    kelasLabel: profile?.kelasLabel || "",
    // ortu: nama anak opsional (view-only kalau mau)
    anakNama: profile?.anakNama || ""
  }));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    try {
      setSaving(true);
      await setDoc(doc(db, "users", user.uid), {
        displayName: form.displayName,
        phone: form.phone,
      }, { merge:true });

      if (role === "admin_sekolah" && profile?.sekolahId) {
        await updateDoc(doc(db,"sekolahtng",profile.sekolahId),{
          sekolah: form.sekolahNama || null
        });
        await setDoc(doc(db,"users",user.uid),{ sekolahNama: form.sekolahNama || null },{merge:true});
      }
      if (role === "walas" && profile?.idKelas) {
        await setDoc(doc(db,"users",user.uid),{ kelasLabel: form.kelasLabel || null },{merge:true});
      }
      if (role === "ortu") {
        await setDoc(doc(db,"users",user.uid),{ anakNama: form.anakNama || null },{merge:true});
      }
      onClose();
      alert("Profil diperbarui.");
    } catch(e) {
      console.error(e); alert("Gagal menyimpan profil.");
    } finally { setSaving(false); }
  };

  return (
    <div style={m.backdrop}>
      <div style={m.card}>
        <h3>Ubah Profil</h3>
        <div style={{display:"grid",rowGap:8}}>
          <input placeholder="Nama tampilan" value={form.displayName}
                 onChange={e=>setForm(f=>({...f,displayName:e.target.value}))} />
          <input placeholder="No. HP" value={form.phone}
                 onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
          {role==="admin_sekolah" && (
            <input placeholder="Nama Sekolah" value={form.sekolahNama}
                   onChange={e=>setForm(f=>({...f,sekolahNama:e.target.value}))} />
          )}
          {role==="walas" && (
            <input placeholder="Label Kelas (opsional)" value={form.kelasLabel}
                   onChange={e=>setForm(f=>({...f,kelasLabel:e.target.value}))} />
          )}
          {role==="ortu" && (
            <input placeholder="Nama Anak (opsional)" value={form.anakNama}
                   onChange={e=>setForm(f=>({...f,anakNama:e.target.value}))} />
          )}
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}>
          <button onClick={onClose}>Batal</button>
          <button onClick={save} disabled={saving}>{saving?"Menyimpan…":"Simpan"}</button>
        </div>
      </div>
    </div>
  );
}

const m = {
  backdrop:{position:"fixed",inset:0,background:"rgba(0,0,0,.15)",display:"flex",alignItems:"center",justifyContent:"center"},
  card:{background:"#fff",padding:16,borderRadius:12,minWidth:340,boxShadow:"0 10px 30px rgba(0,0,0,.1)"}
};
