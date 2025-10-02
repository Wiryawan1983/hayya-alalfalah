import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function LogoutButton({ to = "/login", compact = false, style }) {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signOut(auth);
      navigate(to);
    } catch (e) {
      console.error(e);
      alert("Gagal logout: " + (e.message || e.code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onLogout}
      disabled={busy}
      style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#f8f8f8", ...style }}
      title="Keluar dari akun"
    >
      {busy ? "Keluar…" : compact ? "Keluar" : "Keluar dari Akun"}
    </button>
  );
}
