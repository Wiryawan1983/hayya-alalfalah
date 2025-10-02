// authGuard.jsx
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";

export default function AuthGate({ children }) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setReady(true);
        navigate("/login");
        return;
      }
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        // belum terdaftar → ke Register
        navigate("/register", { state: { email: u.email } });
      } else {
        setReady(true);
      }
    });
    return () => unsub();
  }, [navigate]);

  return ready ? children : null; // atau spinner
}
