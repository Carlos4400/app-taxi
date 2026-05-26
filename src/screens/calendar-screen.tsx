import React from "react";
import { Shell } from "../components/shell";
import { ConfirmDialog } from "../components/common";
import { IconBack, IconCalendar } from "../components/navigation-icons";
import { IconPencilNeon, IconMoneyBag, IconTimer } from "../components/calendar-icons";
import { fmt, fmtDuration } from "../logic/formatters";
import { getDiffMins, today } from "../logic/date-time";
import { getStartOffset, getDaysInMonth } from "../logic/calendar-date";
import { calcularTurnoContable } from "../logic/accounting";
import { C, G } from "../shared/ui-theme";
import type { AppSettings, NotaCalendario, NotaTipo, Reserva, Turno } from "../shared/types";

interface CalendarScreenProps {
  calendarMonth: Date;
  setCalendarMonth: (d: Date) => void;
  calendarView: 'month' | 'agenda';
  setCalendarView: (v: 'month' | 'agenda') => void;
  showMonthPicker: boolean;
  setShowMonthPicker: React.Dispatch<React.SetStateAction<boolean>>;
  pickerYear: number;
  setPickerYear: React.Dispatch<React.SetStateAction<number>>;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  showNotaDialog: boolean;
  setShowNotaDialog: (v: boolean) => void;
  notaTipo: NotaTipo;
  setNotaTipo: (t: NotaTipo) => void;
  notaTexto: string;
  setNotaTexto: (t: string) => void;
  editingNota: NotaCalendario | null;
  setEditingNota: (n: NotaCalendario | null) => void;
  notes: NotaCalendario[];
  setNotes: (n: NotaCalendario[] | ((prev: NotaCalendario[]) => NotaCalendario[])) => void;
  showReservaDialog: boolean;
  setShowReservaDialog: (v: boolean) => void;
  reservaTime: string;
  setReservaTime: (t: string) => void;
  reservaOrigen: string;
  setReservaOrigen: (o: string) => void;
  reservaDestino: string;
  setReservaDestino: (d: string) => void;
  reservaCliente: string;
  setReservaCliente: (c: string) => void;
  reservaTelefono: string;
  setReservaTelefono: (t: string) => void;
  reservaNotas: string;
  setReservaNotas: (n: string) => void;
  editingReserva: Reserva | null;
  setEditingReserva: (r: Reserva | null) => void;
  reservations: Reserva[];
  setReservations: (r: Reserva[] | ((prev: Reserva[]) => Reserva[])) => void;
  confirmDialog: {
    text: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmBg?: string;
    confirmColor?: string;
    confirmBorder?: string;
  } | null;
  setConfirmDialog: (d: null | {
    text: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmBg?: string;
    confirmColor?: string;
    confirmBorder?: string;
  }) => void;
  history: Turno[];
  settings: AppSettings;
  openNewReserva: (date?: string) => void;
  setScreen: (screen: string) => void;
  setViewTurno: (turno: Turno) => void;
  setReturnScreen: (screen: string | null) => void;
}

const renderReservaCardField = (
  label: string,
  value: React.ReactNode,
  options: { href?: string; full?: boolean; muted?: boolean; compact?: boolean; center?: boolean } = {}
) => {
  const valueStyle = {
    color: options.muted ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.86)",
    fontSize: options.center ? (options.compact ? 17 : 18) : (options.compact ? 14 : 15),
    fontWeight: options.muted ? 600 : 750,
    lineHeight: 1.28,
    wordBreak: "break-word" as const,
    textDecoration: "none",
    textAlign: options.center ? "center" as const : "left" as const,
  };

  return (
    <div
      style={{
        gridColumn: options.full ? "1 / -1" : undefined,
        background: "rgba(0,0,0,0.22)",
        border: "1px solid rgba(255,255,255,0.075)",
        borderRadius: 11,
        padding: options.compact ? "7px 9px" : "8px 10px",
        minWidth: 0,
        textAlign: options.center ? "center" as const : "left" as const,
      }}
    >
      <div style={{ fontSize: options.compact ? 11 : 12, fontWeight: 900, color: options.muted ? "rgba(255,255,255,0.42)" : C, textTransform: "uppercase", marginBottom: 4, textAlign: options.center ? "center" : "left" }}>
        {label}
      </div>
      {options.href ? (
        <a href={options.href} style={valueStyle}>
          {value}
        </a>
      ) : (
        <div style={valueStyle}>{value}</div>
      )}
    </div>
  );
};

const reservaInputStyle = {
  width: "100%",
  background: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: 14,
  color: "white",
  padding: "13px 14px",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box" as const,
};

const reservaFieldGroupStyle = {
  marginLeft: 10,
  paddingLeft: 12,
  borderLeft: `1px solid ${C}55`,
};

const renderReservaLabel = (primary: string, secondary: string, required = false) => (
  <div style={{ marginBottom: 6 }}>
    <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.72)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
      {primary}{required ? " *" : ""}
    </div>
    {secondary && (
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.36)", marginTop: 1 }}>
        {secondary}
      </div>
    )}
  </div>
);

const renderReservaSection = (title: string, subtitle: string) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4, marginBottom: 2 }}>
    <div style={{ fontSize: 16, fontWeight: 900, color: C, textTransform: "uppercase", letterSpacing: "0.8px" }}>
      {title}
    </div>
    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.34)", fontWeight: 700 }}>
      {subtitle}
    </div>
  </div>
);

function renderReservaDialog(
  showReservaDialog: boolean,
  reservaTime: string,
  setReservaTime: (t: string) => void,
  reservaOrigen: string,
  setReservaOrigen: (o: string) => void,
  reservaDestino: string,
  setReservaDestino: (d: string) => void,
  reservaCliente: string,
  setReservaCliente: (c: string) => void,
  reservaTelefono: string,
  setReservaTelefono: (t: string) => void,
  reservaNotas: string,
  setReservaNotas: (n: string) => void,
  selectedDate: string,
  setSelectedDate: (d: string) => void,
  editingReserva: Reserva | null,
  setEditingReserva: (r: Reserva | null) => void,
  setConfirmDialog: (d: null | {
    text: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmBg?: string;
    confirmColor?: string;
    confirmBorder?: string;
  }) => void,
  reservations: Reserva[],
  setReservations: (r: Reserva[] | ((prev: Reserva[]) => Reserva[])) => void,
  setShowReservaDialog: (v: boolean) => void
) {
  if (!showReservaDialog) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Formulario Reserva"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        animation: "fadeUp 0.2s ease"
      }}
    >
      <div
        style={{
          background: "oklch(0.18 0.03 260)",
          borderRadius: 22,
          padding: 22,
          width: "92%",
          maxWidth: 420,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 13
        }}
      >
        <div style={{ marginBottom: 2 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C, letterSpacing: "-0.3px", textAlign: "center", textTransform: "uppercase" }}>
            {editingReserva ? "Edit booking" : "Taxi booking"}
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginTop: 4, lineHeight: 1.35, textAlign: "center" }}>
            Please fill in your booking details.
          </div>
        </div>

        {renderReservaSection("When", "")}
        <div style={{ ...reservaFieldGroupStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            {renderReservaLabel("Date", "", true)}
            <input
              type="date"
              value={selectedDate}
              onClick={e => e.currentTarget.showPicker?.()}
              onChange={e => setSelectedDate(e.target.value)}
              style={reservaInputStyle}
            />
          </div>

          <div>
            {renderReservaLabel("Time", "", true)}
            <input
              type="time"
              value={reservaTime}
              onClick={e => e.currentTarget.showPicker?.()}
              onChange={e => setReservaTime(e.target.value)}
              style={reservaInputStyle}
            />
          </div>
        </div>

        {renderReservaSection("Client", "")}
        <div style={reservaFieldGroupStyle}>
          {renderReservaLabel("Your name", "", true)}
          <input
            type="text"
            placeholder=""
            value={reservaCliente}
            onChange={e => setReservaCliente(e.target.value)}
            style={reservaInputStyle}
          />
        </div>

        <div style={reservaFieldGroupStyle}>
          {renderReservaLabel("Phone number", "", true)}
          <input
            type="tel"
            placeholder=""
            value={reservaTelefono}
            onChange={e => setReservaTelefono(e.target.value)}
            style={reservaInputStyle}
          />
        </div>

        {renderReservaSection("Pickup", "")}
        <div style={reservaFieldGroupStyle}>
          {renderReservaLabel("Pickup location", "Hotel, Apartments, Address or Meeting point", true)}
          <input
            type="text"
            placeholder=""
            value={reservaOrigen}
            onChange={e => setReservaOrigen(e.target.value)}
            style={reservaInputStyle}
          />
        </div>

        <div style={reservaFieldGroupStyle}>
          {renderReservaLabel("Destination", "", true)}
          <input
            type="text"
            placeholder=""
            value={reservaDestino}
            onChange={e => setReservaDestino(e.target.value)}
            style={reservaInputStyle}
          />
        </div>

        <div style={{ marginTop: 4 }}>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: C, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Optional notes
            </div>
          </div>
          <div style={reservaFieldGroupStyle}>
            <input
              type="text"
              placeholder=""
              value={reservaNotas}
              onChange={e => setReservaNotas(e.target.value)}
              style={reservaInputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {editingReserva && (
            <button
              onClick={() => {
                const id = editingReserva.id;
                setConfirmDialog({
                  text: "¿Seguro que quieres eliminar esta reserva?",
                  onConfirm: () => {
                    setReservations(prev => prev.filter(r => r.id !== id));
                    setShowReservaDialog(false);
                  }
                });
              }}
              aria-label="Eliminar reserva"
              style={{ width: 48, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255, 100, 100, 0.3)", background: "rgba(255, 80, 80, 0.12)", color: "#ff6b6b", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
            >
              🗑️
            </button>
          )}
          <button
            onClick={() => setShowReservaDialog(false)}
            style={{
              flex: 1,
              padding: "13px 0",
              borderRadius: 14,
              border: "none",
              background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.65)",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!selectedDate || !reservaTime || !reservaOrigen || !reservaDestino || !reservaCliente || !reservaTelefono) {
                alert("Por favor rellena todos los campos obligatorios.");
                return;
              }
              if (editingReserva) {
                setReservations(prev => prev.map(r => r.id === editingReserva.id ? {
                  ...r,
                  date: selectedDate,
                  time: reservaTime,
                  origen: reservaOrigen,
                  destino: reservaDestino,
                  cliente: reservaCliente,
                  telefono: reservaTelefono,
                  notas: reservaNotas
                } : r));
              } else {
                const newRes: Reserva = {
                  id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
                  date: selectedDate,
                  time: reservaTime,
                  origen: reservaOrigen,
                  destino: reservaDestino,
                  cliente: reservaCliente,
                  telefono: reservaTelefono,
                  notas: reservaNotas
                };
                setReservations(prev => [...prev, newRes]);
              }
              setShowReservaDialog(false);
            }}
            style={{
              flex: 1.5,
              padding: "13px 0",
              borderRadius: 14,
              border: "none",
              background: C,
              color: "black",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            {editingReserva ? "Actualizar" : "Reservar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CalendarScreen({
  calendarMonth,
  setCalendarMonth,
  calendarView,
  setCalendarView,
  showMonthPicker,
  setShowMonthPicker,
  pickerYear,
  setPickerYear,
  selectedDate,
  setSelectedDate,
  showNotaDialog,
  setShowNotaDialog,
  notaTipo,
  setNotaTipo,
  notaTexto,
  setNotaTexto,
  editingNota,
  setEditingNota,
  notes,
  setNotes,
  showReservaDialog,
  setShowReservaDialog,
  reservaTime,
  setReservaTime,
  reservaOrigen,
  setReservaOrigen,
  reservaDestino,
  setReservaDestino,
  reservaCliente,
  setReservaCliente,
  reservaTelefono,
  setReservaTelefono,
  reservaNotas,
  setReservaNotas,
  editingReserva,
  setEditingReserva,
  reservations,
  setReservations,
  confirmDialog,
  setConfirmDialog,
  history,
  settings,
  openNewReserva,
  setScreen,
  setViewTurno,
  setReturnScreen,
}: CalendarScreenProps) {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const startOffset = getStartOffset(year, month);
  const daysInMonth = getDaysInMonth(year, month);

  const prevMonth = () => {
    setCalendarMonth(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCalendarMonth(new Date(year, month + 1, 1));
  };

  const openNewNota = (date?: string) => {
    setEditingNota(null);
    setEditingReserva(null);
    setSelectedDate(date || today());
    setNotaTipo("Normal");
    setNotaTexto("");
    setShowNotaDialog(true);
  };

  const openEditReserva = (r: Reserva) => {
    setEditingReserva(r);
    setSelectedDate(r.date);
    setReservaTime(r.time);
    setReservaOrigen(r.origen);
    setReservaDestino(r.destino);
    setReservaCliente(r.cliente);
    setReservaTelefono(r.telefono);
    setReservaNotas(r.notas);
    setShowReservaDialog(true);
  };

  const openEditNota = (n: NotaCalendario) => {
    setEditingNota(n);
    setSelectedDate(n.date);
    setNotaTipo(n.tipo);
    setNotaTexto(n.texto);
    setShowNotaDialog(true);
  };

  const saveNota = () => {
    if (!notaTexto.trim()) {
      alert("Por favor escribe el texto de la nota.");
      return;
    }
    if (editingNota) {
      setNotes(prev => prev.map(n => n.id === editingNota.id ? {
        ...n,
        date: selectedDate,
        tipo: notaTipo,
        texto: notaTexto
      } : n));
    } else {
      const newNote: NotaCalendario = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        date: selectedDate,
        tipo: notaTipo,
        texto: notaTexto
      };
      setNotes(prev => [...prev, newNote]);
    }
    setShowNotaDialog(false);
  };

  const dayReservations = reservations.filter(r => r.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const dayNotes = notes.filter(n => n.date === selectedDate);
  const dayTurnos = history.filter(t => (t.startDate || t.date) === selectedDate);

  const agendaDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const daysWithEvents = agendaDays.filter(dayStr => {
    const dayRes = reservations.some(r => r.date === dayStr);
    const dayN = notes.some(n => n.date === dayStr);
    const dayT = history.some(t => (t.startDate || t.date) === dayStr);
    return dayRes || dayN || dayT;
  });

  const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const getNotaTipoColor = (t: NotaTipo) => {
    switch (t) {
      case 'ITV': return 'oklch(0.70 0.18 25)';
      case 'Seguro': return 'oklch(0.75 0.16 70)';
      case 'Normal': return 'oklch(0.65 0.20 280)';
      case 'Día libre': return 'oklch(0.68 0.20 145)';
      default: return 'white';
    }
  };

  const formatAgendaDate = (dStr: string) => {
    if (dStr === today()) return "Hoy";
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dStr === tomorrow.toISOString().slice(0, 10)) return "Mañana";
    const d = new Date(dStr + "T12:00:00");
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" }).replace(/^\w/, c => c.toUpperCase());
  };

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", position: "relative" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexShrink: 0, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }} onClick={() => setScreen("home")}><IconBack /></button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>Calendario</div>
          </div>

          <button
            onClick={() => setCalendarView(calendarView === 'month' ? 'agenda' : 'month')}
            style={{
              height: 44,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 12,
              padding: "0 22px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "white",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.15s"
            }}
          >
            <span style={{ fontSize: 18 }}>⇄</span>
            <span>{calendarView === 'month' ? 'Agenda' : 'Calendario'}</span>
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => openNewReserva()}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              border: "2px solid rgba(255,255,255,0.16)",
              background: C,
              color: "white",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            <span>+ 📅</span>
            <span>Reserva</span>
          </button>
          <button
            onClick={() => openNewNota()}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              border: "2px solid rgba(255,255,255,0.16)",
              background: C,
              color: "white",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            <span>+ 📝</span>
            <span>Nota</span>
          </button>
        </div>

        {calendarView === 'month' ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <button onClick={prevMonth} style={{ background: "none", border: "none", color: C, fontSize: 18, cursor: "pointer", padding: "8px 12px" }}>◀</button>
              <button
                onClick={() => {
                  setPickerYear(year);
                  setShowMonthPicker(!showMonthPicker);
                }}
                style={{ background: "none", border: "none", color: "white", fontSize: 16, fontWeight: 800, cursor: "pointer", padding: "4px 8px", display: "flex", alignItems: "center", gap: 6 }}
              >
                {MONTHS_ES[month]} {year}
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{showMonthPicker ? "▲" : "▼"}</span>
              </button>
              <button onClick={nextMonth} style={{ background: "none", border: "none", color: C, fontSize: 18, cursor: "pointer", padding: "8px 12px" }}>▶</button>
            </div>

            {showMonthPicker && (
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 14, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    onClick={() => setPickerYear(y => y - 1)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "none", color: C, fontSize: 16, cursor: "pointer", width: 36, height: 36, borderRadius: 10 }}
                  >◀</button>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>{pickerYear}</div>
                  <button
                    onClick={() => setPickerYear(y => y + 1)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "none", color: C, fontSize: 16, cursor: "pointer", width: 36, height: 36, borderRadius: 10 }}
                  >▶</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {MONTHS_ES.map((mLabel, mIdx) => {
                    const isCurrent = mIdx === month && pickerYear === year;
                    const isToday = mIdx === new Date().getMonth() && pickerYear === new Date().getFullYear();
                    return (
                      <button
                        key={mIdx}
                        onClick={() => {
                          setCalendarMonth(new Date(pickerYear, mIdx, 1));
                          setShowMonthPicker(false);
                        }}
                        style={{
                          padding: "10px 0",
                          borderRadius: 10,
                          border: isToday ? `1px solid ${C}` : "1px solid rgba(255,255,255,0.06)",
                          background: isCurrent ? C : "rgba(255,255,255,0.04)",
                          color: isCurrent ? "black" : "rgba(255,255,255,0.85)",
                          fontSize: 13,
                          fontWeight: isCurrent ? 800 : 700,
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        {mLabel.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    const now = new Date();
                    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                    setSelectedDate(today());
                    setShowMonthPicker(false);
                  }}
                  style={{
                    padding: "10px 0",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Ir a Hoy
                </button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center" }}>
              {["L", "M", "X", "J", "V", "S", "D"].map((day, idx) => (
                <div key={idx} style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
                  {day}
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
              {Array.from({ length: startOffset }).map((_, idx) => (
                <div key={`offset-${idx}`} style={{ aspectRatio: "1" }} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const isSelected = selectedDate === dayStr;
                const isToday = dayStr === today();

                const hasTurno = history.some(t => (t.startDate || t.date) === dayStr);
                const dayResList = reservations.filter(r => r.date === dayStr);
                const dayNoteList = notes.filter(n => n.date === dayStr);

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      const clickedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                      setSelectedDate(clickedDate);
                    }}
                    style={{
                      aspectRatio: "1",
                      background: isSelected ? "rgba(180, 120, 255, 0.12)" : isToday ? "rgba(0, 220, 180, 0.08)" : "rgba(255,255,255,0.02)",
                      border: isSelected
                        ? `1.5px solid ${C}`
                        : isToday
                          ? `1.5px solid ${G}`
                          : "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 12,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 2px",
                      cursor: "pointer",
                      position: "relative",
                      transition: "all 0.15s"
                    }}
                  >
                    <span style={{
                      fontSize: 14,
                      fontWeight: isSelected || isToday ? 800 : 500,
                      color: isSelected ? C : isToday ? G : "white"
                    }}>
                      {dayNum}
                    </span>

                    <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", width: "100%" }}>
                      {hasTurno && <span style={{ fontSize: 8 }}>🚖</span>}
                      {dayResList.length > 0 && (
                        <span style={{ fontSize: 8, background: C, color: "black", borderRadius: 4, padding: "0 2px", fontWeight: "bold" }}>
                          {dayResList.length}
                        </span>
                      )}
                      {dayNoteList.length > 0 && <span style={{ fontSize: 8 }}>📝</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              key={selectedDate}
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 20,
                padding: 16,
                border: "1px solid rgba(255,255,255,0.07)",
                animation: "fadeUp 0.25s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }).replace(/^\w/, c => c.toUpperCase())}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openNewReserva(selectedDate)} style={{ border: "none", background: "rgba(180, 120, 255, 0.1)", color: C, borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Reserva</button>
                  <button onClick={() => openNewNota(selectedDate)} style={{ border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Nota</button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dayTurnos.length === 0 && dayReservations.length === 0 && dayNotes.length === 0 && (
                  <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "16px 0", fontSize: 13, fontStyle: "italic" }}>
                    Sin eventos para este día
                  </div>
                )}

                {dayTurnos.map(turno => {
                  const gananciaTurno = calcularTurnoContable(turno, settings).miGanancia;

                  let tiempoTurno = fmtDuration(0);
                  if (turno.startTime && turno.endTime) {
                    let totalMins = getDiffMins(turno.startTime, turno.endTime);
                    if (turno.totalPausedMinutes) totalMins = Math.max(0, totalMins - turno.totalPausedMinutes);
                    tiempoTurno = fmtDuration(totalMins);
                  }

                  return (
                    <div
                      key={turno.id}
                      onClick={() => { setReturnScreen("calendar"); setViewTurno(turno); setScreen("summary"); }}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 14,
                        padding: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.72)", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16 }}>🚖</span>
                        <span style={{ fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>Turno cerrado</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 900, color: "oklch(0.78 0.18 150)" }}>
                          <IconMoneyBag s={16} c="oklch(0.78 0.18 150)" />
                          {fmt(gananciaTurno)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 900, color: "oklch(0.85 0.12 210)" }}>
                          <IconTimer s={16} c="oklch(0.85 0.12 210)" />
                          {tiempoTurno}
                        </span>
                      </div>
                      <span style={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }}>➔</span>
                    </div>
                  );
                })}

                {dayReservations.map(res => (
                  <div key={res.id} style={{ background: "rgba(180, 120, 255, 0.07)", border: "1px solid rgba(180, 120, 255, 0.26)", borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: C, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                        Reserva
                      </div>
                      <button
                        onClick={() => openEditReserva(res)}
                        style={{
                          width: 34,
                          height: 34,
                          flex: "0 0 34px",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0
                        }}
                        title="Editar reserva"
                        aria-label="Editar reserva"
                      >
                        <IconPencilNeon s={24} />
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                      {renderReservaCardField("Time", res.time, { full: true, center: true })}
                      {renderReservaCardField("Client", res.cliente)}
                      {renderReservaCardField("Phone", res.telefono, { href: `tel:${res.telefono}` })}
                      {renderReservaCardField("Pickup", res.origen, { full: true })}
                      {renderReservaCardField("Destination", res.destino, { full: true })}
                      {res.notas && renderReservaCardField("Notes", res.notas, { full: true, muted: true })}
                    </div>
                  </div>
                ))}

                {dayNotes.map(note => {
                  const col = getNotaTipoColor(note.tipo);
                  return (
                    <div key={note.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.06)`, borderLeft: `4px solid ${col}`, borderRadius: 12, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: col, textTransform: "uppercase", marginBottom: 3 }}>{note.tipo}</div>
                        <div style={{ fontSize: 14, color: "white", lineHeight: 1.3 }}>{note.texto}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => openEditNota(note)}
                          style={{
                            width: 34,
                            height: 34,
                            flex: "0 0 34px",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0
                          }}
                          title="Editar nota"
                          aria-label="Editar nota"
                        >
                          <IconPencilNeon s={22} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {daysWithEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 4 }}>Sin eventos próximos</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>No hay reservas ni notas planificadas para los próximos 14 días.</div>
              </div>
            ) : (
              daysWithEvents.map(dayStr => {
                const dayRes = reservations.filter(r => r.date === dayStr).sort((a, b) => a.time.localeCompare(b.time));
                const dayN = notes.filter(n => n.date === dayStr);
                const dayT = history.filter(t => (t.startDate || t.date) === dayStr);

                return (
                  <div key={dayStr} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 6, marginBottom: 10 }}>
                      {formatAgendaDate(dayStr)}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {dayT.map(t => {
                        const gananciaTurno = calcularTurnoContable(t, settings).miGanancia;

                        let tiempoTurno = fmtDuration(0);
                        if (t.startTime && t.endTime) {
                          let totalMins = getDiffMins(t.startTime, t.endTime);
                          if (t.totalPausedMinutes) totalMins = Math.max(0, totalMins - t.totalPausedMinutes);
                          tiempoTurno = fmtDuration(totalMins);
                        }

                        return (
                          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.72)", flexWrap: "wrap" }}>
                            <span>🚖</span>
                            <span style={{ fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>Turno cerrado</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 900, color: "oklch(0.78 0.18 150)" }}>
                              <IconMoneyBag s={16} c="oklch(0.78 0.18 150)" />
                              {fmt(gananciaTurno)}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 900, color: "oklch(0.85 0.12 210)" }}>
                              <IconTimer s={16} c="oklch(0.85 0.12 210)" />
                              {tiempoTurno}
                            </span>
                          </div>
                        );
                      })}

                      {dayRes.map(res => (
                        <div key={res.id} style={{ display: "flex", flexDirection: "column", gap: 8, background: "rgba(180, 120, 255, 0.07)", border: "1px solid rgba(180, 120, 255, 0.22)", padding: 10, borderRadius: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: C, textTransform: "uppercase", letterSpacing: "0.35px" }}>
                              Reserva
                            </div>
                            <button
                              onClick={() => openEditReserva(res)}
                              style={{
                                width: 32,
                                height: 32,
                                flex: "0 0 32px",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 9,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                padding: 0
                              }}
                              title="Editar reserva"
                              aria-label="Editar reserva"
                            >
                              <IconPencilNeon s={22} />
                            </button>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                            {renderReservaCardField("Time", res.time, { full: true, center: true, compact: true })}
                            {renderReservaCardField("Client", res.cliente, { compact: true })}
                            {renderReservaCardField("Phone", res.telefono, { href: `tel:${res.telefono}`, compact: true })}
                            {renderReservaCardField("Pickup", res.origen, { full: true, compact: true })}
                            {renderReservaCardField("Destination", res.destino, { full: true, compact: true })}
                            {res.notas && renderReservaCardField("Notes", res.notas, { full: true, muted: true, compact: true })}
                          </div>
                        </div>
                      ))}

                      {dayN.map(n => {
                        const col = getNotaTipoColor(n.tipo);
                        return (
                          <div key={n.id} style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 13 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: col, textTransform: "uppercase" }}>[{n.tipo}]</span>
                            <span style={{ color: "white" }}>{n.texto}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {renderReservaDialog(
          showReservaDialog,
          reservaTime,
          setReservaTime,
          reservaOrigen,
          setReservaOrigen,
          reservaDestino,
          setReservaDestino,
          reservaCliente,
          setReservaCliente,
          reservaTelefono,
          setReservaTelefono,
          reservaNotas,
          setReservaNotas,
          selectedDate,
          setSelectedDate,
          editingReserva,
          setEditingReserva,
          setConfirmDialog,
          reservations,
          setReservations,
          setShowReservaDialog
        )}

        {showNotaDialog && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Formulario Nota"
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              animation: "fadeUp 0.2s ease"
            }}
          >
            <div
              style={{
                background: "oklch(0.18 0.03 260)",
                borderRadius: 20,
                padding: 24,
                width: "90%",
                maxWidth: 340,
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: "white", textTransform: "uppercase", marginBottom: 4 }}>
                {editingNota ? "Editar Nota" : "Nueva Nota"}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>Categoría</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(['ITV', 'Seguro', 'Normal', 'Día libre'] as const).map(t => {
                    const isSelected = notaTipo === t;
                    const col = getNotaTipoColor(t);
                    return (
                      <button
                        key={t}
                        onClick={() => setNotaTipo(t)}
                        style={{
                          border: isSelected ? `2.5px solid ${col}` : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 10,
                          padding: "6px 10px",
                          background: isSelected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                          color: isSelected ? col : "rgba(255,255,255,0.6)",
                          fontSize: 12,
                          fontWeight: isSelected ? 800 : 600,
                          cursor: "pointer",
                          transition: "all 0.1s"
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Descripción</div>
                <input
                  type="text"
                  placeholder="Escribe el detalle aquí..."
                  value={notaTexto}
                  onChange={e => setNotaTexto(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "white",
                    padding: "10px 14px",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                {editingNota && (
                  <button
                    onClick={() => {
                      const id = editingNota.id;
                      setConfirmDialog({
                        text: "¿Seguro que quieres eliminar esta nota?",
                        onConfirm: () => {
                          setNotes(prev => prev.filter(n => n.id !== id));
                          setShowNotaDialog(false);
                        }
                      });
                    }}
                    aria-label="Eliminar nota"
                    style={{
                      width: 48,
                      padding: "12px 0",
                      borderRadius: 12,
                      border: "1px solid rgba(255, 100, 100, 0.3)",
                      background: "rgba(255, 80, 80, 0.12)",
                      color: "#ff6b6b",
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    🗑️
                  </button>
                )}
                <button
                  onClick={() => setShowNotaDialog(false)}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    borderRadius: 12,
                    border: "none",
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveNota}
                  style={{
                    flex: 1.2,
                    padding: "12px 0",
                    borderRadius: 12,
                    border: "none",
                    background: C,
                    color: "black",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}

      </div>
    </Shell>
  );
}
