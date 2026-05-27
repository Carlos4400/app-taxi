// src/login-screen.tsx
//
// Pantalla de login + registro + recuperación de contraseña.
//
// Diseño:
//   - Un único campo "Usuario o email" en login. Si lleva "@", se trata como email;
//     si no, se busca el username en Firestore (colección "usernames") para obtener su email.
//   - Registro pide: nombre de usuario, email, contraseña, repetir contraseña.
//   - Recuperación pide solo el email y dispara sendPasswordResetEmail.
//
// Estilo: paleta OKLCH consistente con main.tsx (constantes duplicadas a propósito
// para no tener que tocar el archivo grande todavía).

import React from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";

const { useState } = React;

// --- Paleta (mismos valores que main.tsx) ---
const G = "oklch(0.68 0.20 145)";
const GBG = "oklch(0.18 0.07 145)";
const N = "oklch(0.62 0.06 260)";
const NBG = "oklch(0.18 0.03 260)";
const F = "oklch(0.70 0.18 25)";
const FBG = "oklch(0.19 0.06 25)";
const BG_APP = "oklch(0.14 0.02 260)";
const TEXT = "oklch(0.92 0.02 260)";
const MUTED = "oklch(0.60 0.04 260)";

// Validaciones de username: 3-20 caracteres, letras, números y guion bajo.
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

// --- Traducciones de errores de Firebase Auth a mensajes en español ---
function mensajeError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "El email no tiene un formato válido.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Usuario o contraseña incorrectos.";
    case "auth/email-already-in-use":
      return "Ese email ya está registrado. Inicia sesión o usa otro.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/network-request-failed":
      return "Sin conexión a internet. Inténtalo más tarde.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos.";
    case "username-taken":
      return "Ese nombre de usuario ya está en uso.";
    case "username-not-found":
      return "Ese usuario no existe.";
    case "password-mismatch":
      return "Las contraseñas no coinciden.";
    case "username-format":
      return "El usuario debe tener entre 3 y 20 caracteres (letras, números y _).";
    case "empty-field":
      return "Rellena todos los campos.";
    default:
      return "Ha ocurrido un error. Inténtalo de nuevo.";
  }
}

// --- Helpers de autenticación ---

// Resuelve un input que puede ser email o username a su email real.
async function resolverEmail(input: string): Promise<string> {
  if (input.includes("@")) return input.trim();
  const usernameLower = input.trim().toLowerCase();
  const snap = await getDoc(doc(db, "usernames", usernameLower));
  if (!snap.exists()) {
    const err: any = new Error("username-not-found");
    err.code = "username-not-found";
    throw err;
  }
  const data = snap.data() as { email: string };
  return data.email;
}

export async function entrar(usuarioOEmail: string, password: string): Promise<void> {
  if (!usuarioOEmail.trim() || !password) {
    const err: any = new Error("empty-field");
    err.code = "empty-field";
    throw err;
  }
  const email = await resolverEmail(usuarioOEmail);
  await signInWithEmailAndPassword(auth, email, password);
}

export async function registrar(
  username: string,
  email: string,
  password: string,
  password2: string
): Promise<void> {
  if (!username.trim() || !email.trim() || !password || !password2) {
    const err: any = new Error("empty-field");
    err.code = "empty-field";
    throw err;
  }
  if (!USERNAME_RE.test(username)) {
    const err: any = new Error("username-format");
    err.code = "username-format";
    throw err;
  }
  if (password !== password2) {
    const err: any = new Error("password-mismatch");
    err.code = "password-mismatch";
    throw err;
  }

  const usernameLower = username.trim().toLowerCase();

  // ¿username ya cogido?
  const existing = await getDoc(doc(db, "usernames", usernameLower));
  if (existing.exists()) {
    const err: any = new Error("username-taken");
    err.code = "username-taken";
    throw err;
  }

  // Crea la cuenta en Auth.
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const uid = cred.user.uid;

  // Crea username y perfil de forma atómica.
  const batch = writeBatch(db);
  batch.set(doc(db, "usernames", usernameLower), {
    email: email.trim(),
    uid,
  });
  batch.set(doc(db, "users", uid, "meta", "profile"), {
    username: username.trim(),
    usernameLower,
    email: email.trim(),
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function recuperarPassword(email: string): Promise<void> {
  if (!email.trim()) {
    const err: any = new Error("empty-field");
    err.code = "empty-field";
    throw err;
  }
  await sendPasswordResetEmail(auth, email.trim());
}

// --- UI ---

type Modo = "login" | "register" | "reset";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: NBG,
  border: `1px solid ${N}`,
  borderRadius: 10,
  padding: "14px 14px",
  fontSize: 16,
  color: TEXT,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: MUTED,
  marginBottom: 6,
  marginTop: 14,
};

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  background: GBG,
  border: `1px solid ${G}`,
  color: G,
  borderRadius: 12,
  padding: "14px",
  fontSize: 16,
  fontWeight: 600,
  marginTop: 22,
  cursor: "pointer",
};

const linkBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: G,
  fontSize: 14,
  cursor: "pointer",
  padding: "4px 8px",
  textDecoration: "underline",
};

export function LoginScreen() {
  const [modo, setModo] = useState<Modo>("login");

  // Campos compartidos
  const [usuarioOEmail, setUsuarioOEmail] = useState("");
  const [password, setPassword] = useState("");

  // Campos de registro
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  // Campos de reset
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function limpiarMensajes() {
    setError("");
    setResetMsg("");
  }

  async function onSubmitLogin(e: React.FormEvent) {
    e.preventDefault();
    limpiarMensajes();
    setCargando(true);
    try {
      await entrar(usuarioOEmail, password);
      // El AuthGate detectará el cambio y montará App automáticamente.
    } catch (err: any) {
      setError(mensajeError(err?.code || ""));
    } finally {
      setCargando(false);
    }
  }

  async function onSubmitRegister(e: React.FormEvent) {
    e.preventDefault();
    limpiarMensajes();
    setCargando(true);
    try {
      await registrar(regUsername, regEmail, regPassword, regPassword2);
      // Tras registrar, Firebase ya deja al usuario logueado.
    } catch (err: any) {
      setError(mensajeError(err?.code || ""));
    } finally {
      setCargando(false);
    }
  }

  async function onSubmitReset(e: React.FormEvent) {
    e.preventDefault();
    limpiarMensajes();
    setCargando(true);
    try {
      await recuperarPassword(resetEmail);
      setResetMsg(
        "Te hemos enviado un email con instrucciones para restablecer la contraseña."
      );
    } catch (err: any) {
      setError(mensajeError(err?.code || ""));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG_APP,
        color: TEXT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "oklch(0.17 0.02 260)",
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${NBG}`,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: TEXT,
            textAlign: "center",
          }}
        >
          Mi Turno
        </h1>
        <p
          style={{
            margin: "6px 0 22px",
            fontSize: 13,
            color: MUTED,
            textAlign: "center",
          }}
        >
          {modo === "login" && "Inicia sesión para ver tus turnos"}
          {modo === "register" && "Crea una cuenta nueva"}
          {modo === "reset" && "Recupera tu contraseña"}
        </p>

        {error && (
          <div
            style={{
              background: FBG,
              border: `1px solid ${F}`,
              color: F,
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}
        {resetMsg && (
          <div
            style={{
              background: GBG,
              border: `1px solid ${G}`,
              color: G,
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            {resetMsg}
          </div>
        )}

        {modo === "login" && (
          <form onSubmit={onSubmitLogin} autoComplete="on">
            <label style={labelStyle}>Usuario o email</label>
            <input
              id="login-username"
              name="login-username"
              type="text"
              autoComplete="username"
              value={usuarioOEmail}
              onChange={(e) => setUsuarioOEmail(e.target.value)}
              style={inputStyle}
            />
            <label style={labelStyle}>Contraseña</label>
            <input
              id="login-password"
              name="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" disabled={cargando} style={primaryBtnStyle}>
              {cargando ? "Entrando…" : "Entrar"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setResetEmail("");
                  setModo("reset");
                }}
                style={linkBtnStyle}
              >
                He olvidado mi contraseña
              </button>
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setModo("register");
                }}
                style={linkBtnStyle}
              >
                Crear cuenta
              </button>
            </div>
          </form>
        )}

        {modo === "register" && (
          <form onSubmit={onSubmitRegister} autoComplete="on">
            <label style={labelStyle}>Nombre de usuario</label>
            <input
              id="reg-username"
              name="reg-username"
              type="text"
              autoComplete="username"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              style={inputStyle}
              placeholder="3-20 caracteres, sin espacios"
            />
            <label style={labelStyle}>Email</label>
            <input
              id="reg-email"
              name="reg-email"
              type="email"
              autoComplete="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              style={inputStyle}
            />
            <label style={labelStyle}>Contraseña</label>
            <input
              id="reg-password"
              name="reg-password"
              type="password"
              autoComplete="new-password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              style={inputStyle}
              placeholder="Mínimo 6 caracteres"
            />
            <label style={labelStyle}>Repite la contraseña</label>
            <input
              id="reg-password-repeat"
              name="reg-password-repeat"
              type="password"
              autoComplete="new-password"
              value={regPassword2}
              onChange={(e) => setRegPassword2(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" disabled={cargando} style={primaryBtnStyle}>
              {cargando ? "Creando cuenta…" : "Crear cuenta"}
            </button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setModo("login");
                }}
                style={linkBtnStyle}
              >
                Ya tengo cuenta
              </button>
            </div>
          </form>
        )}

        {modo === "reset" && (
          <form onSubmit={onSubmitReset} autoComplete="on">
            <label style={labelStyle}>Email asociado a tu cuenta</label>
            <input
              id="reset-email"
              name="reset-email"
              type="email"
              autoComplete="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" disabled={cargando} style={primaryBtnStyle}>
              {cargando ? "Enviando…" : "Enviar email de recuperación"}
            </button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setModo("login");
                }}
                style={linkBtnStyle}
              >
                Volver al login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
