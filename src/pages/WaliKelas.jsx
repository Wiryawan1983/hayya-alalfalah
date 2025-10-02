import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import Topbar from "../components/Topbar";
import RecapPanel from "../components/recap/RecapPanel";

export default function WaliKelas({ user, profile }) {
  const sid = profile?.sekolahId;
  const kid = profile?.idKelas;
  const [siswa, setSiswa] = useState([]);
  const [nisn, setNisn] = useState("");

  useEffect(()=>{(async()=>{
    if (!sid || !kid) return;
    const snap = await getDocs(collection(db,"sekolahtng",sid,"kelas",kid,"siswa"));
    setSiswa(snap.docs.map(d=>({id:d.id,...d.data()})));
  })()},[sid,kid]);

  const addSiswa = async () => {
    const id = prompt("NISN?");
    const nama = prompt("Nama?");
    if (!id) return;
    await setDoc(doc(db,"sekolahtng",sid,"kelas",kid,"siswa",id), { nama }, { merge:true });
    alert("Siswa ditambahkan."); setSiswa(arr=>[...arr,{id, nama}]);
  };
  const removeSiswa = async (id) => {
    if (!window.confirm("Hapus siswa ini?")) return;
    await deleteDoc(doc(db,"sekolahtng",sid,"kelas",kid,"siswa",id));
    setSiswa(arr=>arr.filter(x=>x.id!==id));
  };

  return (
    <>
      <Topbar user={user} profile={profile} title="Wali Kelas" />
      <div style={{padding:16, display:"grid", gap:16}}>
        <section style={box}>
          <h3>Siswa Asuhan ({kid||"-"})</h3>
          <div style={{marginBottom:8}}>
            <button onClick={addSiswa}>+ Tambah Siswa</button>
          </div>
          <ul>
            {siswa.map(s=>(
              <li key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f4f4f4"}}>
                <span>{s.id} — {s.nama||"-"}</span>
                <span>
                  <button onClick={()=>setNisn(s.id)} style={{marginRight:8}}>Rekap</button>
                  <button onClick={()=>removeSiswa(s.id)}>Hapus</button>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {nisn && (
          <section style={box}>
            <h3>Rekap Siswa: {nisn}</h3>
            <RecapPanel sekolahId={sid} kelasId={kid} nisn={nisn} />
          </section>
        )}
      </div>
    </>
  );
}
const box = { border:"1px solid #eee", borderRadius:12, padding:12, background:"#fff" };
