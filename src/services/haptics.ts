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

async function impactMedium(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Medium });
    } catch (e) {
      console.warn('Error en impactMedium:', e);
    }
  }
}

async function impactHeavy(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Heavy });
    } catch (e) {
      console.warn('Error en impactHeavy:', e);
    }
  }
}

export async function hapticKey(): Promise<void> {
  return impactMedium();
}

export async function hapticOpen(): Promise<void> {
  return impactMedium();
}

export async function hapticBackClose(): Promise<void> {
  return impactMedium();
}

export async function hapticSave(): Promise<void> {
  return impactHeavy();
}

export async function hapticDanger(): Promise<void> {
  return impactHeavy();
}

export async function hapticInvalid(): Promise<void> {
  return impactHeavy();
}
