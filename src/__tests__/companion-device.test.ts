import { beforeEach, describe, expect, it, vi } from "vitest";

const cdmMock = vi.hoisted(() => ({
  getStatus: vi.fn(),
  pair: vi.fn(),
  disassociate: vi.fn(),
  listPairedWatches: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    getPlatform: () => "android",
    isNativePlatform: () => true,
  },
  registerPlugin: vi.fn(() => cdmMock),
}));

describe("companion-device", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta el estado de asociacion nativo", async () => {
    cdmMock.getStatus.mockResolvedValue({ associated: true, associations: ["watch"] });
    const { getCompanionWatchStatus } = await import("../services/companion-device");

    await expect(getCompanionWatchStatus()).resolves.toEqual({
      available: true,
      associated: true,
      associations: ["watch"],
    });
  });

  it("inicia el selector nativo para emparejar el reloj", async () => {
    cdmMock.pair.mockResolvedValue({ associated: true });
    const { pairCompanionWatch } = await import("../services/companion-device");

    await expect(pairCompanionWatch()).resolves.toEqual({ associated: true });
    expect(cdmMock.pair).toHaveBeenCalledTimes(1);
    expect(cdmMock.pair).toHaveBeenCalledWith(undefined);
  });

  it("emparejar dirigido envia targetAddress al nativo", async () => {
    cdmMock.pair.mockResolvedValue({ associated: true });
    const { pairCompanionWatch } = await import("../services/companion-device");

    await pairCompanionWatch("AA:BB:CC:DD:EE:FF");
    expect(cdmMock.pair).toHaveBeenCalledWith({ targetAddress: "AA:BB:CC:DD:EE:FF" });
  });

  it("desasocia las asociaciones companion existentes", async () => {
    cdmMock.disassociate.mockResolvedValue({ associated: false, removed: 1 });
    const { unpairCompanionWatch } = await import("../services/companion-device");

    await expect(unpairCompanionWatch()).resolves.toEqual({ associated: false, removed: 1 });
    expect(cdmMock.disassociate).toHaveBeenCalledTimes(1);
  });

  it("lista los relojes emparejados a nivel sistema", async () => {
    cdmMock.listPairedWatches.mockResolvedValue({
      watches: [{ name: "Carlos' Xiaomi Watch 5", address: "AA:BB:CC:DD:EE:FF" }],
      bluetoothEnabled: true,
    });
    const { listPairedWatches } = await import("../services/companion-device");

    await expect(listPairedWatches()).resolves.toEqual({
      watches: [{ name: "Carlos' Xiaomi Watch 5", address: "AA:BB:CC:DD:EE:FF" }],
      bluetoothEnabled: true,
    });
    expect(cdmMock.listPairedWatches).toHaveBeenCalledTimes(1);
  });
});
