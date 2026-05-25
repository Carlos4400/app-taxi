// src/firebase.ts
//
// Inicialización de Firebase para "Mi Turno APP Taxi".
//
// - Auth: usuarios con email + contraseña.
// - Firestore con caché local persistente: los datos descargados quedan
//   guardados en IndexedDB del WebView de Capacitor, así el usuario puede
//   consultar turnos antiguos sin conexión.
// - persistentMultipleTabManager: tolera que se abran varias pestañas a la vez
//   (importante en entorno Vite dev; inofensivo en producción Android).
//
// La API key NO es un secreto: identifica el proyecto. La seguridad real la
// dan las reglas de Firestore (ver tarea #4).

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQwGpLAxSf-JQbGIqEfAgsahcZfYO_2vU",
  authDomain: "mi-turno-app-taxi.firebaseapp.com",
  projectId: "mi-turno-app-taxi",
  storageBucket: "mi-turno-app-taxi.firebasestorage.app",
  messagingSenderId: "1005007572788",
  appId: "1:1005007572788:web:c6920a7684c2b0c2f75f61",
  measurementId: "G-7CTQCC8FMB",
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
