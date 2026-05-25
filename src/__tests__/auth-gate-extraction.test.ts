import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AuthGate extraction", () => {
  const authGatePath = resolve("src/screens/auth-gate.tsx");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps Firebase auth gating outside main.tsx", () => {
    expect(existsSync(authGatePath)).toBe(true);

    const authGateSource = readFileSync(authGatePath, "utf8");
    expect(authGateSource).toContain("onAuthStateChanged");
    expect(authGateSource).toContain("LoginScreen");
    expect(authGateSource).toContain("AppComponent");
    expect(mainSource).toContain('from "./screens/auth-gate"');
    expect(mainSource).toContain("<AuthGate AppComponent={App} />");
    expect(mainSource).not.toMatch(/^function AuthGate\(\)/m);
  });
});
