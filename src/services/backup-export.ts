import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { buildBackupPayload } from "../logic/backup";

export async function exportBackupJSON(backup: ReturnType<typeof buildBackupPayload>) {
  const json = JSON.stringify(backup, null, 2);
  const fileName = `taxi_backup_${new Date().toISOString().split("T")[0]}.json`;

  try {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    await Share.share({
      title: "Copia de seguridad",
      text: "Copia de seguridad de Mi Turno",
      url: result.uri,
      dialogTitle: "Compartir / Guardar copia de seguridad",
    });
  } catch (e) {
    console.error("exportBackupJSON error:", e);
    alert("No se pudo exportar la copia de seguridad.");
  }
}
