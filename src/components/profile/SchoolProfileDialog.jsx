// src/components/profile/SchoolProfileDialog.jsx
import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";
import { uploadSchoolLogo } from "../../lib/storageUpload";

export default function SchoolProfileDialog({ sid, initial, onSaved, onClose }) {
  const [form, setForm] = useState({
    sekolah: "",
    bentuk: "",
    propinsi: "",
    kabupaten_kota: "",
    kecamatan: "",
    alamat_jalan: "",
    lintang: "",
    bujur: "",
    npsn: "",
  });

  const [logoURL, setLogoURL] = useState(initial?.logoURL || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [msg, setMsg] = useState("");     // success/info
  const [err, setErr] = useState("");     // error
  const fileRef = useRef(null);

  useEffect(() => {
    if (!initial) return;
    setForm({
      sekolah: initial.sekolah || "",
      bentuk: initial.bentuk || "",
      propinsi: initial.propinsi || initial.provinsi || "",
      kabupaten_kota: initial.kabupaten_kota || initial.kabupaten || "",
      kecamatan: initial.kecamatan || "",
      alamat_jalan: initial.alamat_jalan || "",
      lintang: (initial.lintang ?? "") === "" ? "" : String(initial.lintang),
      bujur:  (initial.bujur  ?? "") === "" ? "" : String(initial.bujur),
      npsn: initial.npsn || sid || "",
    });
    setLogoURL(initial.logoURL || "");
  }, [initial, sid]);

  const updateField = (k) => (e) => {
    setMsg(""); setErr("");
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const save = async () => {
    try {
      setMsg(""); setErr("");
      if (!sid) { setErr("sekolahId (sid) tidak ditemukan."); return; }
      setSaving(true);

      const lintangNum = form.lintang === "" ? null : Number(form.lintang);
      const bujurNum  = form.bujur  === "" ? null : Number(form.bujur);

      const payload = {
        sekolah: form.sekolah.trim(),
        bentuk: form.bentuk.trim(),
        propinsi: form.propinsi.trim(),
        kabupaten_kota: form.kabupaten_kota.trim(),
        kecamatan: form.kecamatan.trim(),
        alamat_jalan: form.alamat_jalan.trim(),
        lintang: Number.isFinite(lintangNum) ? lintangNum : null,
        bujur: Number.isFinite(bujurNum) ? bujurNum : null,
        npsn: form.npsn.trim(),
        status: initial?.status || "S",
        ...(logoURL ? { logoURL } : {}),
      };

      await setDoc(doc(db, "sekolahtng", sid), payload, { merge: true });
      setMsg("Profil sekolah berhasil diperbarui.");
      onSaved?.(payload);
    } catch (e) {
      console.error(e);
      setErr("Gagal menyimpan profil sekolah.");
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (file) => {
    if (!file) return;
    try {
      setMsg(""); setErr("");
      const npsn = (initial?.npsn || form.npsn || "").trim();
      if (!npsn) { setErr("NPSN belum terisi."); return; }
      if (!sid)  { setErr("sekolahId (sid) tidak ditemukan."); return; }
      setUploading(true);
      const url = await uploadSchoolLogo({ npsn, sekolahId: sid, file });
      setLogoURL(url);
      setMsg("Logo berhasil diunggah.");
      onSaved?.({ logoURL: url });
    } catch (e) {
      console.error(e);
      setErr(e?.code || e?.message || "Gagal unggah logo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Edit Profil Sekolah</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Lengkapi identitas sekolah dan unggah logo untuk tampilan yang konsisten.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Alerts */}
        {(msg || err) && (
          <div className="px-4 pt-3">
            {msg && (
              <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                {msg}
              </div>
            )}
            {err && (
              <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {err}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="grid gap-4 p-4 md:grid-cols-[220px_1fr]">
          {/* Logo + Upload */}
          <div className="space-y-2">
            <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              {logoURL ? (
                <img
                  src={logoURL}
                  alt="logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                  Belum ada logo
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 grid place-content-center bg-white/70 dark:bg-slate-900/70">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                id="logo-file"
                type="file"
                accept="image/*"
                disabled={uploading}
                className="hidden"
                onChange={(e) => onUpload(e.target.files?.[0])}
              />
              <label
                htmlFor="logo-file"
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {uploading ? "Mengunggah..." : "Unggah Logo"}
              </label>

              {logoURL && (
                <button
                  type="button"
                  onClick={() => setLogoURL("")}
                  disabled={uploading}
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Hapus preview (tidak menghapus file di storage)"
                >
                  Hapus Preview
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Id (dokumen)">
              <input value={sid || ""} disabled className={INPUT.disabled} />
            </Field>

            <Field label="NPSN" required>
              <input value={form.npsn} onChange={updateField("npsn")} className={INPUT.base} />
            </Field>

            <Field label="Nama Sekolah" className="md:col-span-2" required>
              <input value={form.sekolah} onChange={updateField("sekolah")} className={INPUT.base} />
            </Field>

            <Field label="Bentuk (SD/SMP/SMA/MA/SMK)">
              <input value={form.bentuk} onChange={updateField("bentuk")} className={INPUT.base} />
            </Field>

            <Field label="Provinsi">
              <input value={form.propinsi} onChange={updateField("propinsi")} className={INPUT.base} />
            </Field>

            <Field label="Kabupaten/Kota">
              <input value={form.kabupaten_kota} onChange={updateField("kabupaten_kota")} className={INPUT.base} />
            </Field>

            <Field label="Kecamatan">
              <input value={form.kecamatan} onChange={updateField("kecamatan")} className={INPUT.base} />
            </Field>

            <Field label="Alamat Jalan" className="md:col-span-2">
              <input value={form.alamat_jalan} onChange={updateField("alamat_jalan")} className={INPUT.base} />
            </Field>

            <Field label="Lintang (contoh: -6.234)">
              <input
                type="number"
                step="any"
                value={form.lintang}
                onChange={updateField("lintang")}
                className={INPUT.base}
              />
            </Field>

            <Field label="Bujur (contoh: 107.012)">
              <input
                type="number"
                step="any"
                value={form.bujur}
                onChange={updateField("bujur")}
                className={INPUT.base}
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={saving || uploading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Batal
          </button>
          <button
            onClick={save}
            disabled={saving || uploading}
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95 disabled:opacity-60"
          >
            {saving && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- KOMPONEN KECIL ---------- */
function Field({ label, required = false, className = "", children }) {
  return (
    <label className={`flex flex-col ${className}`}>
      <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const INPUT = {
  base:
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
  disabled:
    "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
};
