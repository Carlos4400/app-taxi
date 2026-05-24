import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("EditEntryDialog extraction", () => {
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const componentPath = resolve("src/components/edit-entry-dialog.tsx");

  it("keeps EditEntryDialog outside main.tsx", () => {
    expect(existsSync(componentPath)).toBe(true);

    const componentSource = readFileSync(componentPath, "utf8");
    expect(componentSource).toContain("export function EditEntryDialog");
    expect(mainSource).toContain('from "./components/edit-entry-dialog"');
    expect(mainSource).not.toMatch(/^function EditEntryDialog/m);
  });
});
