// Import the functions you need from the SDKs you need

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";








// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyCXPTKyVjjfGo0QjdcdarMwQEDHIhDGC5Q",
  authDomain: "my-konselor.firebaseapp.com",
  projectId: "my-konselor",
  storageBucket: "my-konselor.firebasestorage.app",
  messagingSenderId: "406144309188",
  appId: "1:406144309188:web:838b8fc928198c8eaf7691",
  measurementId: "G-17LYB5VXPM"
};


const app = getApps().length ? getApp() : initializeApp(firebaseConfig); // ⬅️ cegah re-init saat HMR/StrictMode
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();

// optional tapi bagus
setPersistence(auth, browserLocalPersistence).catch(console.error);