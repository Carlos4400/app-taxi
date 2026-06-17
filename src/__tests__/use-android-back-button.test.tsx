import { createRoot, type Root } from "react-dom/client";
import { act, useState } from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";
import { useAndroidBackButton } from "../hooks/use-android-back-button";
import type { AdminMode } from "../logic/android-back-button";

// ============================================================================
// Mocks hoisted (declarados antes de los vi.mock para evitar warnings de TDZ).
// ============================================================================

const capacitorAppMock: {
  isNative: boolean;
  addListener: Mock;
  exitApp: Mock;
  handle: { remove: Mock };
} = vi.hoisted(() => ({
  isNative: true,
  addListener: vi.fn(),
  exitApp: vi.fn(),
  // handle devuelto por addListener, con `remove()` que registra invocaciones.
  handle: { remove: vi.fn() },
}));

const handleAndroidBackButtonMock = vi.hoisted(() => vi.fn());
const hapticBackCloseMock = vi.hoisted(() => vi.fn());

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => capacitorAppMock.isNative,
  },
}));

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (event: string, listener: () => void) => {
      capacitorAppMock.addListener(event, listener);
      // Resolvemos la promesa con un handle estable.
      return Promise.resolve(capacitorAppMock.handle);
    },
    exitApp: () => capacitorAppMock.exitApp(),
  },
}));

vi.mock("../services/haptics", () => ({
  hapticBackClose: hapticBackCloseMock,
}));

vi.mock("../logic/android-back-button", () => ({
  handleAndroidBackButton: handleAndroidBackButtonMock,
}));

// ============================================================================
// Helpers
// ============================================================================

type Probe = {
  registerLocalAndroidBackHandler: (handler: () => boolean) => () => void;
};

interface ProbeProps {
  showReservaDialog?: boolean;
  showConfirmDialog?: boolean;
  adminMode?: AdminMode;
  setAdminMode?: (mode: AdminMode) => void;
}

/**
 * Componente de prueba que monta el hook y expone el registro de handler
 * local a través de un ref. Acepta props para poder forzar re-renders con
 * nuevos valores de "showReservaDialog" / "adminMode" y verificar que el
 * snapshot se mantiene actualizado.
 */
function HookProbe({ showReservaDialog, showConfirmDialog, adminMode, setAdminMode }: ProbeProps) {
  const [, setReservaState] = useState(showReservaDialog ?? false);
  const [confirmState, setConfirmState] = useState(showConfirmDialog ?? false);
  const [adminState, setAdminStateInternal] = useState<AdminMode>(adminMode ?? null);

  const setters = {
    setShowReservaDialog: (val: boolean) => setReservaState(val),
    setConfirmDialog: (_value: null) => setConfirmState(false),
    setAdminMode: setAdminMode ?? ((mode: AdminMode) => setAdminStateInternal(mode)),
  };

  const probe = useAndroidBackButton({
    adminMode: adminMode ?? adminState,
    setAdminMode: setters.setAdminMode,
    confirmDialogOpen: confirmState,
    setConfirmDialog: setters.setConfirmDialog,
    editEntryOpen: false,
    setEditEntry: vi.fn(),
    endFieldOpen: false,
    setEndField: vi.fn(),
    showBackupMenu: false,
    setShowBackupMenu: vi.fn(),
    showMonthPicker: false,
    setShowMonthPicker: vi.fn(),
    showNotaDialog: false,
    setShowNotaDialog: vi.fn(),
    showReservaDialog: showReservaDialog ?? false,
    setShowReservaDialog: setters.setShowReservaDialog,
  });

  // Expone la función de registro para que el test pueda instalar handlers
  // locales antes de simular el back button.
  (globalThis as unknown as { __probe: Probe }).__probe = probe;
  return null;
}

// ============================================================================
// Setup / teardown
// ============================================================================

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  // Estado limpio en cada test.
  capacitorAppMock.isNative = true;
  capacitorAppMock.addListener.mockReset();
  capacitorAppMock.exitApp.mockReset();
  capacitorAppMock.handle.remove.mockReset();
  handleAndroidBackButtonMock.mockReset();
  hapticBackCloseMock.mockReset();

  // El mock de addListener resuelve a un handle con `remove()` espiable.
  capacitorAppMock.addListener.mockImplementation(
    (_event: string, _listener: () => void) => Promise.resolve(capacitorAppMock.handle),
  );

  // El store (mockeado arriba) no se usa directamente; en su lugar
  // handleAndroidBackButton recibe el snapshot vía la spy.
  // Re-importamos el store real solo para inicializar el `screen`.
  // (El hook lee `useAppStore((s) => s.screen)`, por lo que necesitamos un
  // store funcional. Zustand expone `getState` aunque no haya provider.)
  // Para estos tests, basta con que el store exista; el `screen` concreto
  // no afecta a la lógica del listener.

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  delete (globalThis as unknown as { __probe?: Probe }).__probe;
});

// ============================================================================
// Tests
// ============================================================================

describe("useAndroidBackButton", () => {
  it("no registra listener si la plataforma no es nativa", async () => {
    capacitorAppMock.isNative = false;

    await act(async () => {
      root.render(<HookProbe />);
      // Damos tiempo a que se resuelva el import dinámico.
      await Promise.resolve();
    });

    expect(capacitorAppMock.addListener).not.toHaveBeenCalled();
  });

  it("registra el listener 'backButton' cuando la plataforma es nativa", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
      // La promesa interna del `import("@capacitor/app")` y la de addListener
      // son ambas microtareas encadenadas; necesitamos un par de awaits.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(capacitorAppMock.addListener).toHaveBeenCalledTimes(1);
    expect(capacitorAppMock.addListener).toHaveBeenCalledWith(
      "backButton",
      expect.any(Function),
    );
  });

  it("invoca handleAndroidBackButton con un snapshot actualizado al pulsar atrás", async () => {
    await act(async () => {
      root.render(<HookProbe showReservaDialog={true} />);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Recuperamos el listener instalado y lo invocamos manualmente.
    const listener = capacitorAppMock.addListener.mock.calls[0][1] as () => void;
    act(() => {
      listener();
    });

    expect(handleAndroidBackButtonMock).toHaveBeenCalledTimes(1);
    const snapshot = handleAndroidBackButtonMock.mock.calls[0][0];
    expect(snapshot.showReservaDialog).toBe(true);
  });

  it("permite que un handler local intercepte el back button sin invocar la lógica global", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Instalamos un handler local que devuelve `true` (handled).
    let invocado = false;
    act(() => {
      (globalThis as unknown as { __probe: Probe }).__probe.registerLocalAndroidBackHandler(
        () => {
          invocado = true;
          return true;
        },
      );
    });

    const listener = capacitorAppMock.addListener.mock.calls[0][1] as () => void;
    act(() => {
      listener();
    });

    expect(invocado).toBe(true);
    expect(handleAndroidBackButtonMock).not.toHaveBeenCalled();
  });

  it("limpia el listener al desmontar el componente", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Desmontamos.
    act(() => {
      root.unmount();
    });

    expect(capacitorAppMock.handle.remove).toHaveBeenCalledTimes(1);
  });

  it("reenvía la acción exitApp al plugin de Capacitor cuando el handler global lo solicita", async () => {
    // Forzamos el camino en el que handleAndroidBackButton llama a `exitApp`.
    handleAndroidBackButtonMock.mockImplementation((_snap, actions) => {
      actions.exitApp();
    });

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const listener = capacitorAppMock.addListener.mock.calls[0][1] as () => void;
    act(() => {
      listener();
    });

    expect(capacitorAppMock.exitApp).toHaveBeenCalledTimes(1);
  });
});
