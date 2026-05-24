import { sortTurnosByDateDesc } from "./turnos";

export type CSVEntry = {
  id: number;
  type: string;
  amount: number;
  note: string;
  time: string;
};

export type CSVTurno = {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string;
  entries: CSVEntry[];
  totalP: number;
  totalD: number;
  totalA: number;
  totalE: number;
  totalF: number;
  totalN: number;
  dinero: number;
  km: number;
  notes: string;
  startDate: string;
  totalPausedMinutes: number;
};

export function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function parseCSVToHistory(csvText: string): CSVTurno[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const newTurnosMap = new Map<string, CSVTurno>();
  let timeBase = Date.now();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 10) continue;

    const [date, startTime, endTime, type, amountStr, note, time, dineroStr, kmStr] = cols;

    const key = `${date}|${startTime}|${endTime}`;
    if (!newTurnosMap.has(key)) {
      newTurnosMap.set(key, {
        id: timeBase++,
        date,
        startTime: startTime || null,
        endTime,
        entries: [],
        totalP: 0, totalD: 0, totalA: 0, totalE: 0, totalF: 0, totalN: 0,
        dinero: parseFloat(dineroStr.replace(",", ".")) || 0,
        km: parseFloat(kmStr.replace(",", ".")) || 0,
        notes: "",
        startDate: date,
        totalPausedMinutes: 0
      });
    }

    const turno = newTurnosMap.get(key)!;

    if (type) {
      const amount = parseFloat(amountStr.replace(",", ".")) || 0;
      turno.entries.push({
        id: timeBase++,
        type,
        amount,
        note: note || "",
        time
      });

      if (type === "propina") turno.totalP += amount;
      if (type === "datafono") turno.totalD += amount;
      if (type === "agencia_bono") turno.totalA += amount;
      if (type === "extra") turno.totalE += amount;
      if (type === "gasolina") turno.totalF += amount;
      if (type === "nulo") turno.totalN += amount;
    }
  }

  return sortTurnosByDateDesc(Array.from(newTurnosMap.values()));
}
