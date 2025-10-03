import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Prayer from "./pages/Prayer";
import Register from "./pages/Register";
import Invite from "./pages/Invite";
import Redeem from "./pages/Redeem";
import VerifyStudent from "./pages/VerifyStudent";
import ParentValidation from "./pages/ParentValidation";

// Halaman sesuai role
import SuperAdmin from "./pages/SuperAdmin";
import AdminSekolah from "./pages/AdminSekolah";
import WaliKelas from "./pages/WaliKelas";
import Ortu from "./pages/Ortu";
import DashboardRouter from "./pages/DashboardRouter";

function Loading({ text = "Memuat…" }) {
  return <div style={{ textAlign: "center", marginTop: 80 }}>{text}</div>;
}

function ProtectedRoute({ user, children }) {
  // undefined = masih cek auth
  if (user === undefined) return <Loading />;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  // undefined = loading, null = tidak login, object = user login
  const [user, setUser] = useState(undefined);
  // undefined = loading profil, null = tidak ada profil, object = profil ada
  const [profile, setProfile] = useState(undefined);

  // Pantau auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return unsub;
  }, []);

  // Muat profil users/{uid} saat user berubah
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!user?.uid) {
          if (active) setProfile(null);
          return;
        }
        const snap = await getDoc(doc(db, "users", user.uid));
        if (active) setProfile(snap.data() || {});
      } catch (e) {
        console.error("Gagal memuat profile:", e);
        if (active) setProfile(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  return (
    <Routes>
      {/* Auth pages */}
      <Route
        path="/login"
        element={
          user
            ? profile === undefined
              ? <Loading text="Memuat profil…" />
              : profile
                ? <Navigate to="/dashboard" replace />
                : <Register />
            : <Login />
        }
      />

      <Route
        path="/register"
        element={
          user
            ? profile === undefined
              ? <Loading text="Memuat profil…" />
              : !profile || !profile?.role
                ? <Register />
                : <Navigate to="/dashboard" replace />
            : <Register />
        }
      />

      {/* Landing/home (butuh login) */}
      <Route
        path="/"
        element={
          <ProtectedRoute user={user}>
            <Home user={user} profile={profile || {}} />
          </ProtectedRoute>
        }
      />

      {/* Contoh halaman fitur (butuh login) */}
      <Route
        path="/prayer"
        element={
          <ProtectedRoute user={user}>
            <Prayer user={user} />
          </ProtectedRoute>
        }
      />

      {/* Role dashboards */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute user={user}>
            <SuperAdmin user={user} profile={profile} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user}>
            <AdminSekolah user={user} profile={profile} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/walas"
        element={
          <ProtectedRoute user={user}>
            <WaliKelas user={user} profile={profile} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ortu"
        element={
          <ProtectedRoute user={user}>
            <Ortu user={user} profile={profile} />
          </ProtectedRoute>
        }
      />

      {/* Router penentu dashboard sesuai role */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user}>
            <DashboardRouter user={user} profile={profile} />
          </ProtectedRoute>
        }
      />

      {/* Private page lain */}
      <Route
        path="/invite"
        element={
          <ProtectedRoute user={user}>
            <Invite />
          </ProtectedRoute>
        }
      />

      {/* Public pages */}
      <Route path="/redeem" element={<Redeem />} />
      <Route path="/verify-student" element={
        <ProtectedRoute user={user}>
          <VerifyStudent />
        </ProtectedRoute>
      } />
      <Route path="/parent/validate" element={<ParentValidation user={user} />} />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
