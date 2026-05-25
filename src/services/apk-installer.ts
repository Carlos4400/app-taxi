import { registerPlugin } from "@capacitor/core";

export interface ApkInstallerPluginType {
  canInstallPackages(): Promise<{ value: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  downloadAndInstall(options: { url: string; fileName: string }): Promise<{ success: boolean }>;
}

export const ApkInstaller = registerPlugin<ApkInstallerPluginType>("ApkInstaller");
