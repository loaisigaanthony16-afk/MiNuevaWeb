/** Vibración corta al añadir a la bolsa (solo donde el navegador lo permite). */
export function haptic(ms = 12): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    /* noop */
  }
}
