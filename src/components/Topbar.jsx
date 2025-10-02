// src/components/Topbar.jsx
import React, { useState } from "react";
import ProfileDialog from "./profile/ProfileDialog";              // ✅ sesuaikan path jika beda
import ChangePasswordDialog from "./profile/ChangePasswordDialog";   // ✅ sesuaikan path jika beda
import LogoutButton from "./LogoutButton";

export default function Topbar({ user, profile, title = "Dashboard", school }) {
  const [openProfile, setOpenProfile] = useState(false);
  const [openPwd, setOpenPwd] = useState(false);

  const displayName = profile?.nama || user?.displayName || user?.email || "Pengguna";
  const initials = getInitials(displayName);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800 dark:bg-slate-900/70"
    >
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-3 sm:px-4">
        {/* Kiri: judul + sekolah */}
        <div className="min-w-0 flex items-center gap-2 sm:gap-3">
          <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
            {title}
          </span>
          {school?.name && (
            <span className="hidden select-none text-slate-300 sm:inline">•</span>
          )}
          {school?.name && (
            <span className="min-w-0 flex items-center gap-2">
              {school.logoURL ? (
                <img
                  src={school.logoURL}
                  alt="Logo Sekolah"
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-md border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-base dark:border-slate-700 dark:bg-slate-800">
                  🏫
                </span>
              )}
              <span className="truncate text-[13px] font-medium text-slate-700 dark:text-slate-300 sm:text-sm">
                {school.name}
              </span>
            </span>
          )}
        </div>

        {/* Kanan: actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setOpenProfile(true)}
            className="btn-ghost hidden sm:inline-flex"
            title="Profil"
          >
            {displayName}
          </button>

          <button
            type="button"
            onClick={() => setOpenPwd(true)}
            className="btn-ghost"
          >
            Ubah Sandi
          </button>

          <LogoutButton to="/login" compact />

          <div
            className="ml-1 inline-flex h-8 w-8 select-none items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-[11px] font-bold tracking-wide text-white shadow-sm ring-1 ring-black/5"
            aria-hidden
          >
            {initials}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {openProfile && (
        <ProfileDialog
          user={user}
          profile={profile}
          onClose={() => setOpenProfile(false)}
        />
      )}
      {openPwd && <ChangePasswordDialog user={user} onClose={() => setOpenPwd(false)} />}
    </header>
  );
}

function getInitials(nameLike) {
  if (!nameLike) return "?";
  const raw = String(nameLike).trim();
  // Ambil dua huruf pertama dari dua kata terdepan jika ada
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  // fallback ke dua karakter awal
  return raw.slice(0, 2).toUpperCase();
}
