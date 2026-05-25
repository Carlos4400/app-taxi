import React, { type FC } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { Shell } from "../components/shell";
import { G, P, A, C, GBG, PBG, ABG, CBG } from "../shared/ui-theme";
import { getHomeQuickActionIds } from "../shared/action-ids";
import { IconCalendar, IconSettings, IconAdminNeon, IconLogoutNeon } from "../components/navigation-icons";
import { IconRocket, IconPlay, IconClipboard, IconChart, IconReservaWrite, IconAgenda } from "../components/home-icons";

interface HomeScreenProps {
  isPaused: boolean | undefined;
  isAdmin: boolean;
  active: boolean;
  onSetScreen: (screen: string) => void;
  onSetCalendarView: (view: "month" | "agenda") => void;
  onOpenNewReserva: () => void;
  onSetAdminMode: (mode: null | "list" | { uid: string; username: string }) => void;
  onSetConfirmDialog: (dialog: { text: string; confirmText?: string; onConfirm: () => void } | null) => void;
  renderReservaDialog: () => React.ReactElement | false;
}

export const HomeScreen: FC<HomeScreenProps> = ({
  isPaused,
  isAdmin,
  active,
  onSetScreen,
  onSetCalendarView,
  onOpenNewReserva,
  onSetAdminMode,
  onSetConfirmDialog,
  renderReservaDialog,
}) => {
  const homeQuickActionIds = getHomeQuickActionIds(isAdmin);

  return (
    <Shell burst={false}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "32px 28px 110px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 88, lineHeight: 1, marginBottom: 18 }}>
            🚕
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-1.5px",
            }}
          >
            Mi Turno
          </div>
          <div
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.5)",
              marginTop: 10,
              textTransform: "none",
            }}
          >
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).replace(/^\w/, (c) => c.toUpperCase())}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => {
              onSetScreen("main");
            }}
            style={{
              height: 68,
              padding: 0,
              whiteSpace: "nowrap",
              borderRadius: 20,
              border: isPaused ? "2px solid #3b82f6" : `2px solid ${G}`,
              background: isPaused ? "rgba(59, 130, 246, 0.08)" : GBG,
              color: isPaused ? "#3b82f6" : G,
              fontSize: 18,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            {active ? (
              <>
                <IconRocket s={30} c={G} />
                <IconPlay s={40} c="#3b82f6" />
              </>
            ) : (
              <IconRocket s={30} c={G} />
            )}
            {active ? "Continuar Turno" : "Iniciar Turno"}
          </button>
          <button
            onClick={() => onSetScreen("PantallaTurnos")}
            style={{
              height: 68,
              padding: 0,
              whiteSpace: "nowrap",
              borderRadius: 20,
              border: `2px solid ${P}`,
              background: PBG,
              color: P,
              fontSize: 18,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <IconClipboard s={30} c={P} />
            Turnos
          </button>
          <button
            onClick={() => onSetScreen("contabilidad")}
            style={{
              height: 68,
              padding: 0,
              whiteSpace: "nowrap",
              borderRadius: 20,
              border: `2px solid ${A}`,
              background: ABG,
              color: A,
              fontSize: 18,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <IconChart s={30} c={A} />
            Contabilidad
          </button>
          <button
            onClick={() => onSetScreen("calendar")}
            style={{
              height: 68,
              padding: 0,
              whiteSpace: "nowrap",
              borderRadius: 20,
              border: `2px solid ${C}`,
              background: CBG,
              color: C,
              fontSize: 18,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <IconCalendar s={30} c={C} />
            Calendario
          </button>
        </div>
      </div>
      <button
        onClick={onOpenNewReserva}
        aria-label="Nueva reserva"
        style={{
          position: "absolute",
          top: 24,
          left: 28,
          width: 54,
          height: 54,
          background: "rgba(0, 200, 220, 0.08)",
          border: "1px solid rgba(0, 200, 220, 0.28)",
          borderRadius: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          padding: 0,
        }}
      >
        <IconReservaWrite s={32} />
      </button>
      <button
        onClick={() => { onSetCalendarView("agenda"); onSetScreen("calendar"); }}
        style={{
          position: "absolute",
          top: 24,
          right: 28,
          width: 54,
          height: 54,
          background: "rgba(180, 120, 255, 0.08)",
          border: "1px solid rgba(180, 120, 255, 0.28)",
          borderRadius: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          padding: 0,
        }}
      >
        <IconAgenda s={32} c="oklch(0.75 0.15 290)" />
      </button>
      {renderReservaDialog()}
      {homeQuickActionIds.includes("admin-users") && (
        <button
          onClick={() => onSetAdminMode("list")}
          aria-label="Ver datos de otro usuario"
          title="Ver datos de otro usuario"
          style={{
            position: "absolute",
            bottom: 32,
            left: 28,
            width: 54,
            height: 54,
            background: "rgba(75, 190, 255, 0.08)",
            border: "1px solid rgba(75, 190, 255, 0.28)",
            borderRadius: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            padding: 0,
          }}
        >
          <IconAdminNeon s={32} />
        </button>
      )}
      <button
        onClick={() => {
          onSetConfirmDialog({
            text: "\u00bfCerrar sesi\u00f3n? Tus datos seguir\u00e1n guardados y podr\u00e1s volver a entrar m\u00e1s tarde.",
            confirmText: "Cerrar sesi\u00f3n",
            onConfirm: () => {
              signOut(auth).catch((err) => {
                console.error("signOut error:", err);
              });
            },
          });
        }}
        aria-label="Cerrar sesi\u00f3n"
        title="Cerrar sesi\u00f3n"
        style={{
          position: "absolute",
          bottom: 32,
          right: 94,
          width: 54,
          height: 54,
          background: "rgba(255, 95, 95, 0.08)",
          border: "1px solid rgba(255, 95, 95, 0.28)",
          borderRadius: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          padding: 0,
        }}
      >
        <IconLogoutNeon s={32} />
      </button>
      <button
        onClick={() => { onSetConfirmDialog(null); onSetScreen("settings"); }}
        style={{
          position: "absolute",
          bottom: 32,
          right: 28,
          width: 54,
          height: 54,
          background: "rgba(0, 220, 180, 0.08)",
          border: "1px solid rgba(0, 220, 180, 0.28)",
          borderRadius: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          padding: 0,
        }}
      >
        <IconSettings s={32} c="oklch(0.72 0.01 250)" />
      </button>
    </Shell>
  );
};
