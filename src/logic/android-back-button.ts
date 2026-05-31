export type AdminMode = null | "list" | { uid: string; username: string };

export type AndroidBackButtonSnapshot = {
  adminMode: AdminMode;
  confirmDialogOpen: boolean;
  editEntryOpen: boolean;
  endFieldOpen: boolean;
  screen: string;
  showBackupMenu: boolean;
  showMonthPicker: boolean;
  showNotaDialog: boolean;
  showReservaDialog: boolean;
};

export type AndroidBackButtonActions = {
  closeBackupMenu: () => void;
  closeConfirmDialog: () => void;
  closeEditEntry: () => void;
  closeEndField: () => void;
  closeMonthPicker: () => void;
  closeNotaDialog: () => void;
  closeReservaDialog: () => void;
  exitApp: () => void;
  goBack: () => boolean;
  hapticBackClose: () => void | Promise<void>;
  resetNavigation: (root?: string) => void;
  setAdminMode: (mode: AdminMode) => void;
};

export function handleAndroidBackButton(
  snapshot: AndroidBackButtonSnapshot,
  actions: AndroidBackButtonActions,
): void {
  if (snapshot.confirmDialogOpen) {
    void actions.hapticBackClose();
    actions.closeConfirmDialog();
    return;
  }

  if (snapshot.editEntryOpen) {
    void actions.hapticBackClose();
    actions.closeEditEntry();
    return;
  }

  if (snapshot.endFieldOpen) {
    void actions.hapticBackClose();
    actions.closeEndField();
    return;
  }

  if (snapshot.showBackupMenu) {
    void actions.hapticBackClose();
    actions.closeBackupMenu();
    return;
  }

  if (snapshot.showMonthPicker) {
    void actions.hapticBackClose();
    actions.closeMonthPicker();
    return;
  }

  if (snapshot.showNotaDialog) {
    void actions.hapticBackClose();
    actions.closeNotaDialog();
    return;
  }

  if (snapshot.showReservaDialog) {
    void actions.hapticBackClose();
    actions.closeReservaDialog();
    return;
  }

  if (snapshot.adminMode && typeof snapshot.adminMode === "object") {
    void actions.hapticBackClose();
    actions.setAdminMode("list");
    return;
  }

  if (snapshot.adminMode === "list") {
    void actions.hapticBackClose();
    actions.setAdminMode(null);
    return;
  }

  if (snapshot.screen === "main") {
    actions.resetNavigation("home");
    return;
  }

  if (!actions.goBack()) {
    actions.exitApp();
  }
}
