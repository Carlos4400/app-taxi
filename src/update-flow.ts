export type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "permission_required"
  | "error"
  | "installed";

export interface GitHubReleaseAsset {
  name?: string;
  browser_download_url?: string;
}

export interface GitHubLatestRelease {
  tag_name?: string;
  html_url?: string;
  assets?: GitHubReleaseAsset[];
}

export interface UpdateCheckResult {
  updateState: UpdateState;
  updateMsg: string;
  downloadUrl: string;
  releaseUrl: string;
}

const LATEST_RELEASE_URL = "https://github.com/Carlos4400/app-taxi/releases/latest";

export function resolveLatestApkUpdate(
  data: GitHubLatestRelease,
  currentVersion: string,
): UpdateCheckResult {
  const latestVersion = data.tag_name ? data.tag_name.replace(/[^0-9.]/g, '') : null;

  if (latestVersion && latestVersion !== currentVersion) {
    const apkAsset = data.assets?.find((asset) => asset.name && asset.name.endsWith(".apk"));
    if (apkAsset) {
      return {
        downloadUrl: apkAsset.browser_download_url || "",
        releaseUrl: "",
        updateState: "available",
        updateMsg: `¡Nueva versión ${latestVersion} disponible!`,
      };
    }

    return {
      downloadUrl: "",
      releaseUrl: data.html_url || LATEST_RELEASE_URL,
      updateState: "error",
      updateMsg: "No se encontró APK en el último release.",
    };
  }

  return {
    downloadUrl: "",
    releaseUrl: "",
    updateState: "idle",
    updateMsg: "Tienes la última versión instalada.",
  };
}
