import { auth } from "./firebase";

export function userStorageKey(baseKey: string, uid = auth.currentUser?.uid || ""): string {
  return uid ? `${baseKey}__${uid}` : baseKey;
}

export function readLocalJSON<T>(baseKey: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(baseKey)) || "null") as T | null;
  } catch (e) {
    return null;
  }
}

export function writeUserLocalJSON(uid: string, baseKey: string, value: unknown): void {
  localStorage.setItem(userStorageKey(baseKey, uid), JSON.stringify(value));
}
