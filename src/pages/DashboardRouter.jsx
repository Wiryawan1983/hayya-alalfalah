import React from "react";
import { Navigate } from "react-router-dom";

export default function DashboardRouter({ user, profile }) {
  // Kalau profile belum termuat sama sekali
  if (profile === undefined) {
    return <div style={{ textAlign: "center", marginTop: 60 }}>Memuat…</div>;
  }

  // Kalau sudah login tapi belum punya dokumen profile → ke register
  if (user && !profile) {
    return <Navigate to="/register" replace />;
  }

  // Kalau profile ada tapi role kosong
  if (!profile?.role) {
    return <Navigate to="/register" replace />;
  }

  // Routing sesuai role
  switch (profile.role) {
    case "super_admin":   return <Navigate to="/super-admin" replace />;
    case "admin_sekolah": return <Navigate to="/admin" replace />;
    case "walas":         return <Navigate to="/walas" replace />;
    case "ortu":          return <Navigate to="/ortu" replace />;
    default:              return <Navigate to="/" replace />;
  }
}
