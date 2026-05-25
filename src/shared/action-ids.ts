export type HomeQuickActionId = "new-reservation" | "agenda" | "admin-users" | "logout" | "settings";
export type BackupMenuActionId = "export-json" | "restore-json";

export function getHomeQuickActionIds(isAdmin: boolean): HomeQuickActionId[] {
  const actions: HomeQuickActionId[] = ["new-reservation", "agenda"];
  if (isAdmin) actions.push("admin-users");
  actions.push("logout", "settings");
  return actions;
}

export function getBackupMenuActionIds(_isAdmin: boolean): BackupMenuActionId[] {
  return ["export-json", "restore-json"];
}
