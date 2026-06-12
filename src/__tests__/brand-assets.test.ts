import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

describe("brand taxi assets", () => {
  it("centraliza los assets visuales del taxi para movil web y reloj", () => {
    const brandAssets = readFileSync(
      resolve(root, "src/components/brand-assets.tsx"),
      "utf8",
    );

    expect(brandAssets).toContain("BrandTaxiIcon");
    expect(brandAssets).toContain("BrandTaxiHero");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-20.png");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-18.png");
    expect(brandAssets).toContain("/brand/brand-taxi-logo.png");
    expect(brandAssets).toContain("/brand/brand-taxi-hero.png");
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-20.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-18.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-logo.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-hero.png"))).toBe(true);
  });

  it("precarga las imagenes de marca en el service worker", () => {
    // Sin precarga, con la red caida el catch del SW devolvia un 503 "Offline"
    // y el logo salia roto en portada/ajustes aunque la app cargara de cache
    // (fallo visto el 2026-06-12). Las cuatro imagenes deben ir en ASSETS.
    const sw = readFileSync(resolve(root, "public/sw.js"), "utf8");
    const assetsBlock = sw.slice(sw.indexOf("const ASSETS"), sw.indexOf("];"));

    expect(assetsBlock).toContain("'./brand/brand-taxi-logo.png'");
    expect(assetsBlock).toContain("'./brand/brand-taxi-hero.png'");
    expect(assetsBlock).toContain("'./brand/brand-taxi-mini-18.png'");
    expect(assetsBlock).toContain("'./brand/brand-taxi-mini-20.png'");
    // Cache renombrada para forzar precarga limpia en clientes existentes.
    expect(sw).toMatch(/const CACHE = 'mi-turno-v(?!5')\d+'/);
  });

  it("sustituye los emojis de marca por assets propios en pantallas visibles", () => {
    const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");
    const home = readFileSync(resolve(root, "src/screens/home-screen.tsx"), "utf8");
    const settings = readFileSync(resolve(root, "src/screens/settings-screen.tsx"), "utf8");
    const wearHome = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/NoActiveTurnoScreen.kt"),
      "utf8",
    );

    expect(main).toContain("<BrandTaxiIcon size={20}");
    expect(home).toContain("<BrandTaxiHero");
    expect(home).not.toContain("<BrandTaxiLogo");
    expect(settings).toContain("<BrandTaxiLogo");
    expect(wearHome).toContain("BrandTaxiLogo(");
    expect(home).not.toContain("\u{1F695}");
    expect(settings).not.toContain("\u{1F695}");
    expect(wearHome).not.toContain("\u{1F695}");
  });

  it("mantiene iconos launcher actualizados para PWA Android y Wear", () => {
    expect(existsSync(resolve(root, "public/icon-192.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/icon-512.png"))).toBe(true);
    expect(existsSync(resolve(root, "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"))).toBe(true);
    expect(existsSync(resolve(root, "android/wear/src/main/res/mipmap-xxxhdpi/ic_launcher.png"))).toBe(true);
  });
});
