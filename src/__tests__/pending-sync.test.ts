import { describe, expect, it, beforeEach } from "vitest";
import {
  clearUserPendingSync,
  hasUserPendingSync,
  markUserPendingSync,
  readUserPendingSync,
} from "../services/pending-sync";
import { KEY_PENDING_SYNC } from "../shared/storage-keys";

describe("pending sync storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps pending sync flags scoped by uid", () => {
    markUserPendingSync("uid-1", "turnos");
    markUserPendingSync("uid-2", "notes");

    expect(hasUserPendingSync("uid-1", "turnos")).toBe(true);
    expect(hasUserPendingSync("uid-1", "notes")).toBe(false);
    expect(hasUserPendingSync("uid-2", "notes")).toBe(true);
    expect(localStorage.getItem(`${KEY_PENDING_SYNC}__uid-1`)).toContain("turnos");
    expect(localStorage.getItem(`${KEY_PENDING_SYNC}__uid-2`)).toContain("notes");
  });

  it("removes the pending sync key when the last flag is cleared", () => {
    markUserPendingSync("uid-1", "turnos");
    markUserPendingSync("uid-1", "current");

    clearUserPendingSync("uid-1", "turnos");
    expect(readUserPendingSync("uid-1")).toEqual({ current: true });

    clearUserPendingSync("uid-1", "current");
    expect(readUserPendingSync("uid-1")).toEqual({});
    expect(localStorage.getItem(`${KEY_PENDING_SYNC}__uid-1`)).toBeNull();
  });
});
