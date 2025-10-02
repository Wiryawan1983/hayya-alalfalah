import React from "react";
import Topbar from "../components/Topbar";

export default function SuperAdmin({ user, profile }) {
  return (
    <>
      <Topbar user={user} profile={profile} title="Super Admin" />
      <div style={{padding:16}}>
        <p>Akses penuh. (Todo: kelola semua sekolah, pengguna, approvals.)</p>
      </div>
    </>
  );
}
