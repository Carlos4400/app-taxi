import { beforeEach, describe, expect, it, vi } from "vitest";

const cdmMock = vi.hoisted(() => ({
  getStatus: vi.fn(),
  pair: vi.fn(),
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
  });
});
