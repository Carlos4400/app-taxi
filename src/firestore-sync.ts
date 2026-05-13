// src/firestore-sync.ts
//
// Helpers para sincronizar el estado local de la app con Firestore.
//
// Modelo:
//   users/{uid}/meta/current      ← documento único (CurrentState)
//   users/{uid}/meta/settings     ← documento único (AppSettings)
//   users/{uid}/meta/profile      ← documento único (perfil del usuario)
//   users/{uid}/turnos/{id}       ← un doc por Turno
//   users/{uid}/reservations/{id} ← un doc por Reserva
//   users/{uid}/notes/{id}        ← un doc por NotaCalendario
//   users/{uid}/weekOverrides/{wid} ← un doc por WeekOverride
//
// Decisión arquitectónica: las listas usan SUBCOLECCIONES (un doc por item).
// Motivos verificables:
//   - Firestore limita 1 MiB por documento; un único doc con todo el historial
//     podría reventar tras 2-3 años de turnos.
//   - Cada cambio en un único doc reescribe todo y consume cupo de escrituras
//     más rápido. Con subcolección, solo se reescribe el doc que cambia.

import {
  collection,
  doc,
  getDoc,
  setDoc,
  writeBatch,
  CollectionReference,
  DocumentReference,
  Firestore,
} from "firebase/firestore";

// Ruta tipada a un documento bajo users/{uid}/meta/*
export function userMetaDocRef(db: Firestore, uid: string, name: string): DocumentReference {
  return doc(db, "users", uid, "meta", name);
}

// Ruta tipada a una subcolección bajo users/{uid}/{name}
export function userSubcollectionRef(db: Firestore, uid: string, name: string): CollectionReference {
  return collection(db, "users", uid, name);
}

// Guarda un objeto único bajo users/{uid}/meta/{name}.
export async function saveUserDoc<T extends object>(
  db: Firestore,
  uid: string,
  name: string,
  data: T,
): Promise<void> {
  await setDoc(userMetaDocRef(db, uid, name), data as any);
}

// Sincroniza una subcolección con un array local: añade/actualiza los items
// que han cambiado, borra los que ya no están. Hace diff por id y SOLO
// escribe lo que cambió, para no malgastar cupo de escrituras.
//
// El parámetro getId es opcional: por defecto toma item.id, pero permite usar
// otros campos como identificador (p.ej. weekId para WeekOverride).
export async function syncSubcollection<T>(
  db: Firestore,
  uid: string,
  subcollectionName: string,
  oldItems: T[],
  newItems: T[],
  getId: (item: T) => string | number = (i: any) => i.id,
): Promise<void> {
  const collRef = userSubcollectionRef(db, uid, subcollectionName);

  const oldById = new Map<string, T>(oldItems.map((i) => [String(getId(i)), i]));
  const newById = new Map<string, T>(newItems.map((i) => [String(getId(i)), i]));

  // Firestore writeBatch admite hasta 500 operaciones. Si pasamos de ahí,
  // troceamos en batches sucesivos.
  const ops: { type: "set" | "delete"; id: string; data?: T }[] = [];

  for (const id of oldById.keys()) {
    if (!newById.has(id)) {
      ops.push({ type: "delete", id });
    }
  }
  for (const [id, item] of newById) {
    const oldItem = oldById.get(id);
    if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
      ops.push({ type: "set", id, data: item });
    }
  }

  if (ops.length === 0) return;

  for (let i = 0; i < ops.length; i += 400) {
    const slice = ops.slice(i, i + 400);
    const batch = writeBatch(db);
    for (const op of slice) {
      const ref = doc(collRef, op.id);
      if (op.type === "set") batch.set(ref, op.data as any);
      else batch.delete(ref);
    }
    await batch.commit();
  }
}

// Comprueba si users/{uid} ya tiene datos en Firestore.
// Usa la existencia del documento meta/profile como marca,
// ya que se crea en el registro y siempre debe existir.
export async function userHasFirestoreData(
  db: Firestore,
  uid: string,
): Promise<boolean> {
  const snap = await getDoc(userMetaDocRef(db, uid, "profile"));
  return snap.exists();
}
