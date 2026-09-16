"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Tag, X } from "lucide-react";
import { useT } from "@/components/locale-context";
import { deviceId } from "@/lib/community";
import { checkRefCode, loadRefCode, saveRefCode, type CheckResult } from "@/lib/referral-client";

/**
 * Campo "Código de amigo" de la bolsa. Valida contra el servidor y deja el
 * código guardado para que el checkout lo mande. `onChange(true)` avisa
 * que la entrega sale gratis, para el resumen de la bolsa.
 */
export default function ReferralCode({ onChange }: { onChange: (free: boolean) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  // Código guardado de una visita anterior: se revalida solo.
  useEffect(() => {
    const saved = loadRefCode();
    if (!saved) return;
    setCode(saved);
    setOpen(true);
    void apply(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function apply(value = code) {
    const clean = value.trim().toUpperCase();
    if (clean.length !== 6) return;
    setBusy(true);
    const res = await checkRefCode(clean, deviceId());
    setBusy(false);
    setResult(res);
    if (res.ok) {
      saveRefCode(clean);
      onChange(true);
    } else {
      saveRefCode("");
      onChange(false);
    }
  }

  function clear() {
    setCode("");
    setResult(null);
    saveRefCode("");
    onChange(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-400 transition hover:text-gold-300">
        <Tag className="h-3.5 w-3.5" />
        {t("cart.code")}
      </button>
    );
  }

  const msg =
    result &&
    (result.ok
      ? result.kind === "credit"
        ? t("cart.codeCredit")
        : t("cart.codeOk")
      : result.reason === "used"
        ? t("cart.codeUsed")
        : result.reason === "no_credit"
          ? t("cart.codeNoCredit")
          : t("cart.codeInvalid"));

  return (
    <div className="mt-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void apply();
        }}
        className="flex gap-2"
      >
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
            setResult(null);
          }}
          placeholder={t("cart.code")}
          maxLength={6}
          autoCapitalize="characters"
          spellCheck={false}
          className={`field h-11 font-mono text-[14px] tracking-[0.2em] ${result && !result.ok ? "field-error" : result?.ok ? "border-hybrid/60" : ""}`}
        />
        {result?.ok ? (
          <button type="button" onClick={clear} aria-label="Quitar" className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-white/10 text-ink-400 hover:text-ink-50">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button type="submit" disabled={code.length !== 6 || busy} className="btn-ghost h-11 min-h-0 shrink-0 px-4 text-[12px] disabled:opacity-40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("cart.codeApply")}
          </button>
        )}
      </form>
      {msg && (
        <p className={`mt-1.5 flex items-center gap-1.5 text-[12px] ${result?.ok ? "text-hybrid" : "text-red-400"}`}>
          {result?.ok && <Check className="h-3.5 w-3.5" />}
          {msg}
        </p>
      )}
    </div>
  );
}
