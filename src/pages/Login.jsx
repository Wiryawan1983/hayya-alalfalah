// src/pages/Login.jsx
import React, { useState } from "react";
import { auth, provider } from "../firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [err, setErr] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);
  const navigate = useNavigate();

  const loginGoogle = async () => {
    setErr("");
    try {
      setBusyGoogle(true);
      await signInWithPopup(auth, provider);
      // ❌ tidak perlu navigate("/")
      // ✅ AuthGuard akan otomatis arahkan ke /register atau /home
    } catch (e) {
      setErr(e?.message || "Gagal login dengan Google");
    } finally {
      setBusyGoogle(false);
    }
  };

  const loginEmail = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      setBusy(true);
      await signInWithEmailAndPassword(auth, email, password);
      // ❌ tidak perlu navigate("/")
      // ✅ biarkan AuthGuard yang mengurus redirect
    } catch (e) {
      setErr(e?.message || "Gagal login dengan email/password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white">
      <div className="mx-auto flex min-h-screen max-w-screen-sm items-center justify-center p-4">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          {/* Header */}
          <div className="mb-4 flex flex-col items-center text-center">
            <img
              src="/logo-alalfalah.png"
              alt="Logo Al Falah"
              className="mb-3 h-16 w-16 rounded-lg border border-slate-200 object-cover"
            />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Aplikasi Pencatatan Sholat
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Masuk untuk melanjutkan
            </p>
          </div>

          {/* Error */}
          {err && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {err}
            </div>
          )}

          {/* Form Email */}
          <form onSubmit={loginEmail} className="space-y-3">
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                placeholder="nama@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-600">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-24 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-1 my-1 inline-flex items-center rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  {showPwd ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className={`btn-primary w-full ${busy ? "opacity-70" : ""}`}
            >
              {busy ? "Memproses…" : "Masuk"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">atau</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Google */}
          <button
            onClick={loginGoogle}
            disabled={busyGoogle}
            className={`btn-ghost flex w-full items-center justify-center gap-2 ${busyGoogle ? "opacity-70" : ""}`}
          >
            <GoogleIcon />
            {busyGoogle ? "Menghubungkan…" : "Masuk dengan Google"}
          </button>

          {/* Footer */}
          <div className="mt-4 text-center text-sm">
            <span className="text-slate-600">Belum punya akun? </span>
            <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
              Daftar akun
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.307 14.691l6.571 4.817C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.307 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.172 0 9.86-1.977 13.409-5.202l-6.197-5.238C29.129 35.091 26.671 36 24 36c-5.202 0-9.616-3.317-11.273-7.946l-6.522 5.025C9.525 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-3.994 5.561l.003-.002 6.197 5.238C39.211 36.993 44 31.5 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}
