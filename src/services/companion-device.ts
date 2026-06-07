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

interface CdmPairPlugin {
  getStatus(): Promise<CompanionStatus>;
  pair(): Promise<CompanionStatus>;
  disassociate(): Promise<CompanionStatus & { removed: number }>;
}

const CdmPair = registerPlugin<CdmPairPlugin>("CdmPair");

export async function getCompanionWatchStatus(): Promise<CompanionStatus & { available: boolean }> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return { available: false, associated: false, associations: [] };
  }
  const status = await CdmPair.getStatus();
  return { available: true, ...status };
}

export async function pairCompanionWatch(): Promise<CompanionStatus> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    throw new Error("El emparejamiento Wear OS solo esta disponible en Android");
  }
  return CdmPair.pair();
}

export async function unpairCompanionWatch(): Promise<CompanionStatus & { removed: number }> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    throw new Error("El emparejamiento Wear OS solo esta disponible en Android");
  }
  return CdmPair.disassociate();
}
