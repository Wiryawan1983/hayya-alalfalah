// src/lib/storageUpload.js
import { storage, db } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";

const getExt = (file) => {
  const m = file?.name?.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "jpg";
};

export async function uploadSchoolLogo({ npsn, sekolahId, file }) {
  if (!npsn) throw new Error("NPSN tidak diketahui.");
  if (!sekolahId) throw new Error("sekolahId tidak diketahui.");
  if (!file) throw new Error("File logo belum dipilih.");

  try {
    const ext = getExt(file);
    const r = ref(storage, `foto_sekolah/${npsn}/logo/logo.${ext}`);

    // upload ke Storage
    await uploadBytes(r, file);

    // ambil URL publik
    const url = await getDownloadURL(r);

    // simpan ke Firestore: sekolahtng/{sekolahId}.logoURL
    await setDoc(doc(db, "sekolahtng", sekolahId), { logoURL: url }, { merge: true });

    return url;
  } catch (err) {
    // tampilkan kode error biar mudah didiagnosa (mis. storage/unauthorized)
    console.error("uploadSchoolLogo gagal:", err?.code || err?.message || err);
    throw err;
  }
}
