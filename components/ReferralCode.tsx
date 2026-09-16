"use client";

import { useEffect, useState } from "react";
import { Check, Gift, Loader2, X } from "lucide-react";
import { useT } from "@/components/locale-context";
import { checkRefCode, loadRefCode, myCode, saveRefCode, type CheckResult } from "@/lib/referral-client";
import { LOYALTY_COUPON_USD, LOYALTY_EVERY, purchasesToNext } from "@/lib/loyalty";

/**
 * Cupón / código de cliente en la bolsa. Siempre visible y grande: el
 * cliente tiene que saber dónde va. Si ya tiene código en este
 * dispositivo, se rellena solo. `onChange(descuento)` avisa a la bolsa.
 */
export default function ReferralCode({ onChange }: { onChange: (discountUsd: number) => void }) {
  const t = useT();
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

  return (
    <div className={`mt-4 rounded-2xl border p-4 transition-colors ${applied ? "border-gold-400/50 bg-gold-400/[0.07]" : "border-gold-400/25 bg-gold-400/[0.04]"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-400 text-ink-900">
          <Gift className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-ink-50">{t("cart.couponTitle")}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-400">
            {t("cart.couponBody").replace("{n}", String(LOYALTY_EVERY)).replace("{usd}", String(LOYALTY_COUPON_USD))}
          </p>
        </div>
      </div>

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
          className={`field h-12 font-mono text-[16px] tracking-[0.25em] ${result && !result.ok ? "field-error" : applied ? "border-gold-400/70" : ""}`}
        />
        {applied ? (
          <button type="button" onClick={clear} aria-label="Quitar" className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] border border-white/10 text-ink-400 hover:text-ink-50">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button type="submit" disabled={code.length !== 6 || busy} className="btn-gold h-12 min-h-0 shrink-0 px-5 text-[12px] disabled:opacity-40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("cart.codeApply")}
          </button>
        )}
      </form>

      {result && !result.ok && <p className="mt-2 text-[12px] text-red-400">{t("cart.codeInvalid")}</p>}
      {result?.ok && (
        <p className={`mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold ${result.kind === "credit" ? "text-hybrid" : "text-gold-200"}`}>
          <Check className="h-3.5 w-3.5" />
          {result.kind === "credit"
            ? t("cart.couponApplied").replace("{usd}", String(result.discountUsd))
            : t("cart.couponProgress")
                .replace("{done}", String(result.purchases % LOYALTY_EVERY === 0 ? 0 : result.purchases % LOYALTY_EVERY))
                .replace("{n}", String(LOYALTY_EVERY))
                .replace("{left}", String(purchasesToNext(result.purchases)))}
        </p>
      )}
      {!result && !code && <p className="mt-2 text-[11.5px] text-ink-500">{t("cart.couponHint")}</p>}
    </div>
  );
}
