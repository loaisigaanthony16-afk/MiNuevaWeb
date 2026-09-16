// =====================================================================
// Referidos, lado navegador: códigos propios guardados en el dispositivo y
// el código de amigo escrito en la bolsa.
// =====================================================================

const OWN_KEY = "vibeMyCodes";
const USE_KEY = "vibeRefCode";

export function loadOwnCodes(): string[] {
  try {
    const raw = window.localStorage.getItem(OWN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function rememberOwnCode(code: string): void {
  try {
    const set = new Set(loadOwnCodes());
    set.add(code);
    window.localStorage.setItem(OWN_KEY, JSON.stringify([...set]));
  } catch {
    /* noop */
  }
}

export function loadRefCode(): string {
  try {
    return window.localStorage.getItem(USE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveRefCode(code: string): void {
  try {
    if (code) window.localStorage.setItem(USE_KEY, code);
    else window.localStorage.removeItem(USE_KEY);
  } catch {
    /* noop */
  }
}

export type CheckResult = { ok: true; kind: "friend" | "credit"; savesNio: number } | { ok: false; reason: "invalid" | "used" | "no_credit" };

export async function checkRefCode(code: string, device: string): Promise<CheckResult> {
  try {
    const res = await fetch("/api/referral/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, device, own: loadOwnCodes() }),
    });
    return (await res.json()) as CheckResult;
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
