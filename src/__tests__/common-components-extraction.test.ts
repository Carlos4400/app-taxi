import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Common component extraction", () => {
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const commonPath = resolve("src/components/common.tsx");

  it("keeps low-risk common components outside main.tsx", () => {
    expect(existsSync(commonPath)).toBe(true);

    const commonSource = readFileSync(commonPath, "utf8");
    expect(commonSource).toContain("export function SmallCard");
    expect(commonSource).toContain("export function MainCard");
    expect(commonSource).toContain("export function ConfirmDialog");

    expect(mainSource).toContain('from "./components/common"');
    expect(mainSource).not.toMatch(/^function SmallCard/m);
    expect(mainSource).not.toMatch(/^function MainCard/m);
    expect(mainSource).not.toMatch(/^function ConfirmDialog/m);
  });

  it("aligns the SmallCard icon with its label row", () => {
    const commonSource = readFileSync(commonPath, "utf8");
    const smallCardSource = commonSource.slice(
      commonSource.indexOf("export function SmallCard"),
      commonSource.indexOf("export function MainCard"),
    );

    expect(smallCardSource).toMatch(/display: "flex",\s*alignItems: "center",\s*gap: 6,/);
    expect(smallCardSource).toMatch(/\{icon\}\s*<div[\s\S]*?\{label\}\s*<\/div>\s*<\/div>\s*<div/);
  });

  it("keeps the active-turn category icon sizes", () => {
    expect(mainSource).toContain("icon={<IconCard s={28} c={P} />}");
    expect(mainSource).toContain("icon={<IconCoin s={28} c={G} />}");
    expect(mainSource).toContain("icon={<IconAgency s={20} c={A} />}");
    expect(mainSource).toContain("icon={<IconExtra s={20} c={E} />}");
    expect(mainSource).toContain("icon={<IconFuel s={24} c={F} />}");
    expect(mainSource).toContain("icon={<IconNulo s={20} c={N} />}");
  });
});
