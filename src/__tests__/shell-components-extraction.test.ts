import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Shell component extraction", () => {
  const shellPath = resolve("src/components/shell.tsx");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps Shell and Burst outside main.tsx", () => {
    expect(existsSync(shellPath)).toBe(true);

    const shellSource = readFileSync(shellPath, "utf8");
    expect(shellSource).toContain("export function Shell");
    expect(shellSource).toContain("function Burst");
    expect(shellSource).toContain("height: \"100dvh\"");
    expect(mainSource).toContain('from "./components/shell"');
    expect(mainSource).not.toMatch(/^function Shell\(/m);
    expect(mainSource).not.toMatch(/^function Burst\(/m);
  });
});
