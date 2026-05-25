export type BackupPayloadValues = {
  history: string | null;
  settings: string | null;
  current: string | null;
  weekOverrides: string | null;
  reservations: string | null;
  notes: string | null;
};

export type BackupStateValues = {
  history: unknown;
  settings: unknown;
  current: unknown;
  weekOverrides: unknown;
  reservations: unknown;
  notes: unknown;
};

export function buildBackupPayload(values: BackupPayloadValues) {
  return {
    history: values.history,
    settings: values.settings,
    current: values.current,
    weekOverrides: values.weekOverrides,
    reservations: values.reservations,
    notes: values.notes,
  };
}

export function buildBackupPayloadFromState(values: BackupStateValues) {
  return buildBackupPayload({
    history: JSON.stringify(values.history),
    settings: JSON.stringify(values.settings),
    current: JSON.stringify(values.current),
    weekOverrides: JSON.stringify(values.weekOverrides),
    reservations: JSON.stringify(values.reservations),
    notes: JSON.stringify(values.notes),
  });
}
