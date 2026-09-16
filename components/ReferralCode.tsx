"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Gift, Loader2, X } from "lucide-react";
import { useT } from "@/components/locale-context";
import { checkRefCode, loadRefCode, myCode, saveRefCode, type CheckResult } from "@/lib/referral-client";
import { LOYALTY_COUPON_USD, LOYALTY_EVERY, purchasesToNext } from "@/lib/loyalty";

/**
 * Cupón / código de cliente en la bolsa. Compacto: una sola línea que se
 * despliega al tocar. Si ya tiene código en este dispositivo, se aplica
 * solo y la línea muestra el estado. `onChange(descuento)` avisa a la bolsa.
 */
export default function ReferralCode({ onChange }: { onChange: (discountUsd: number) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  // Código guardado (el último usado o el propio): se valida solo.
  useEffect(() => {
    const saved = loadRefCode() || myCode();
    if (!saved) return;
    setCode(saved);
    void apply(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function apply(value = code) {
    const clean = value.trim().toUpperCase();
    if (clean.length !== 6) return;
    setBusy(true);
    const res = await checkRefCode(clean);
    setBusy(false);
    setResult(res);
    if (res.ok) {
      saveRefCode(clean);
      onChange(res.discountUsd);
    } else {
      saveRefCode("");
      onChange(0);
    }
  }

  function clear() {
    setCode("");
    setResult(null);
    saveRefCode("");
    onChange(0);
  }

  const applied = result?.ok ?? false;
  const status = result?.ok
    ? result.kind === "credit"
      ? t("cart.couponApplied").replace("{usd}", String(result.discountUsd))
      : t("cart.couponProgress")
          .replace("{done}", String(result.purchases % LOYALTY_EVERY === 0 ? 0 : result.purchases % LOYALTY_EVERY))
          .replace("{n}", String(LOYALTY_EVERY))
          .replace("{left}", String(purchasesToNext(result.purchases)))
    : null;

  return (
    <div className={`mt-3 overflow-hidden rounded-[12px] border transition-colors ${applied ? "border-gold-400/50 bg-gold-400/[0.06]" : "border-white/10 bg-white/[0.02]"}`}>
      {/* Línea compacta: siempre visible, ocupa lo mismo que la dirección */}
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <Gift className={`h-4 w-4 shrink-0 ${applied ? "text-gold-300" : "text-ink-400"}`} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-ink-50">
            {applied && result?.ok && result.kind === "credit" ? status : t("cart.couponTitle")}
          </span>
          <span className={`block truncate text-[11.5px] ${applied ? "text-gold-200" : "text-ink-500"}`}>
            {applied ? (result?.ok && result.kind === "credit" ? code : status) : t("cart.couponShort").replace("{n}", String(LOYALTY_EVERY)).replace("{usd}", String(LOYALTY_COUPON_USD))}
          </span>
        </span>
        {applied && <Check className="h-4 w-4 shrink-0 text-hybrid" />}
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-white/8 px-4 pb-4 pt-3">
          <p className="text-[12px] leading-relaxed text-ink-400">
            {t("cart.couponBody").replace("{n}", String(LOYALTY_EVERY)).replace("{usd}", String(LOYALTY_COUPON_USD))}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void apply();
            }}
            className="mt-3 flex gap-2"
          >
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
                setResult(null);
              }}
              placeholder={t("cart.couponPlaceholder")}
              maxLength={6}
              autoCapitalize="characters"
              spellCheck={false}
              aria-label={t("cart.couponTitle")}
              className={`field h-11 font-mono text-[15px] tracking-[0.25em] ${result && !result.ok ? "field-error" : applied ? "border-gold-400/70" : ""}`}
            />
            {applied ? (
              <button type="button" onClick={clear} aria-label="Quitar" className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-white/10 text-ink-400 hover:text-ink-50">
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button type="submit" disabled={code.length !== 6 || busy} className="btn-gold h-11 min-h-0 shrink-0 px-4 text-[12px] disabled:opacity-40">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("cart.codeApply")}
              </button>
            )}
          </form>
          {result && !result.ok && <p className="mt-2 text-[12px] text-red-400">{t("cart.codeInvalid")}</p>}
          {!result && !code && <p className="mt-2 text-[11.5px] text-ink-500">{t("cart.couponHint")}</p>}
        </div>
      )}
    </div>
  );
}
