import React from "react";
import Topbar from "../components/Topbar";
import RecapPanel from "../components/recap/RecapPanel";

export default function Ortu({ user, profile }) {
  // Asumsi ortu memiliki field sekolahId, idKelas, nisn di user doc (anak utama).
  const sid = profile?.sekolahId;
  const kid = profile?.idKelas;
  const nisn = profile?.nisn;

  return (
    <>
      <Topbar user={user} profile={profile} title="Orang Tua" />
      <div style={{padding:16}}>
        {!sid || !kid || !nisn ? (
          <div>Data anak belum lengkap. Hubungi admin/wali kelas.</div>
        ) : (
          <RecapPanel sekolahId={sid} kelasId={kid} nisn={nisn} />
        )}
      </div>
    </>
  );
}
