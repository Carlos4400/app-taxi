import { Capacitor } from '@capacitor/core';

let hapticsModule: any = null;

async function getHaptics() {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }
  if (!hapticsModule) {
    try {
      hapticsModule = await import('@capacitor/haptics');
    } catch (e) {
      console.warn('Error cargando módulo de haptics:', e);
      return null;
    }
  }
  return hapticsModule;
}

export async function hapticTap(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Light });
    } catch (e) {
      console.warn('Error en hapticTap:', e);
    }
  }
}

export async function hapticConfirm(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Medium });
    } catch (e) {
      console.warn('Error en hapticConfirm:', e);
    }
  }
}

export async function hapticAction(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Heavy });
    } catch (e) {
      console.warn('Error en hapticAction:', e);
    }
  }
}
