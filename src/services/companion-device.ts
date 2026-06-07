import { Capacitor, registerPlugin } from "@capacitor/core";

type CompanionAssociation = string | {
  id?: number;
  displayName?: string;
  deviceProfile?: string;
};

type CompanionStatus = {
  associated: boolean;
  associations?: CompanionAssociation[];
};

export type PairedWatch = {
  name: string;
  address: string;
  connected?: boolean;
};

export type PairedWatchesResult = {
  watches: PairedWatch[];
  remembered: PairedWatch[];
  bluetoothEnabled: boolean;
};

interface CdmPairPlugin {
  getStatus(): Promise<CompanionStatus>;
  pair(options?: { targetAddress?: string }): Promise<CompanionStatus>;
  disassociate(): Promise<CompanionStatus & { removed: number }>;
  listPairedWatches(): Promise<PairedWatchesResult>;
}

const CdmPair = registerPlugin<CdmPairPlugin>("CdmPair");

export async function getCompanionWatchStatus(): Promise<CompanionStatus & { available: boolean }> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return { available: false, associated: false, associations: [] };
  }
  const status = await CdmPair.getStatus();
  return { available: true, ...status };
}

export async function pairCompanionWatch(targetAddress?: string): Promise<CompanionStatus> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    throw new Error("El emparejamiento Wear OS solo esta disponible en Android");
  }
  return CdmPair.pair(targetAddress ? { targetAddress } : undefined);
}

export async function unpairCompanionWatch(): Promise<CompanionStatus & { removed: number }> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    throw new Error("El emparejamiento Wear OS solo esta disponible en Android");
  }
  return CdmPair.disassociate();
}

export async function listPairedWatches(): Promise<PairedWatchesResult> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return { watches: [], remembered: [], bluetoothEnabled: false };
  }
  return CdmPair.listPairedWatches();
}
