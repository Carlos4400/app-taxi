import { describe, expect, it, vi } from "vitest";
import { handleAndroidBackButton } from "../logic/android-back-button";

function createActions() {
  return {
    closeConfirmDialog: vi.fn(),
    closeEditEntry: vi.fn(),
    closeEndField: vi.fn(),
    closeMonthPicker: vi.fn(),
    closeNotaDialog: vi.fn(),
    closeReservaDialog: vi.fn(),
    closeBackupMenu: vi.fn(),
    hapticBackClose: vi.fn(),
    exitApp: vi.fn(),
    goBack: vi.fn(() => false),
    resetNavigation: vi.fn(),
    setAdminMode: vi.fn(),
  };
}

describe("handleAndroidBackButton", () => {
  it("cierra la reserva abierta en home antes de salir de la app", () => {
    const actions = createActions();

    handleAndroidBackButton(
      {
        adminMode: null,
        confirmDialogOpen: false,
        editEntryOpen: false,
        endFieldOpen: false,
        screen: "home",
        showBackupMenu: false,
        showMonthPicker: false,
        showNotaDialog: false,
        showReservaDialog: true,
      },
      actions,
    );

    expect(actions.closeReservaDialog).toHaveBeenCalledTimes(1);
    expect(actions.hapticBackClose).toHaveBeenCalledTimes(1);
    expect(actions.exitApp).not.toHaveBeenCalled();
    expect(actions.goBack).not.toHaveBeenCalled();
  });

  it("vuelve de un usuario admin a la lista sin cerrar la app", () => {
    const actions = createActions();

    handleAndroidBackButton(
      {
        adminMode: { uid: "uid-otro", username: "Otro usuario" },
        confirmDialogOpen: false,
        editEntryOpen: false,
        endFieldOpen: false,
        screen: "home",
        showBackupMenu: false,
        showMonthPicker: false,
        showNotaDialog: false,
        showReservaDialog: false,
      },
      actions,
    );

    expect(actions.setAdminMode).toHaveBeenCalledWith("list");
    expect(actions.hapticBackClose).toHaveBeenCalledTimes(1);
    expect(actions.exitApp).not.toHaveBeenCalled();
    expect(actions.goBack).not.toHaveBeenCalled();
  });

  it("sale de la lista admin a la home propia sin cerrar la app", () => {
    const actions = createActions();

    handleAndroidBackButton(
      {
        adminMode: "list",
        confirmDialogOpen: false,
        editEntryOpen: false,
        endFieldOpen: false,
        screen: "home",
        showBackupMenu: false,
        showMonthPicker: false,
        showNotaDialog: false,
        showReservaDialog: false,
      },
      actions,
    );

    expect(actions.setAdminMode).toHaveBeenCalledWith(null);
    expect(actions.hapticBackClose).toHaveBeenCalledTimes(1);
    expect(actions.exitApp).not.toHaveBeenCalled();
    expect(actions.goBack).not.toHaveBeenCalled();
  });
});
