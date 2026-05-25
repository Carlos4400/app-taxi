import React from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "../services/firebase";
import { LoginScreen } from "./login-screen";

export function AuthGate({ AppComponent }: { AppComponent: React.ComponentType }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "oklch(0.14 0.02 260)",
          color: "oklch(0.92 0.02 260)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        Cargando…
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AppComponent key={user.uid} />;
}
