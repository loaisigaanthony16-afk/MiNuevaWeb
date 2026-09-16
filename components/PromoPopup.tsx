"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Gift, X } from "lucide-react";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import { scrollToSection } from "@/lib/scroll";
import { LOYALTY_COUPON_USD, LOYALTY_EVERY } from "@/lib/loyalty";
import { AGE_KEY } from "@/lib/legal";

const SEEN_KEY = "vibePromoSeen";
const EVERY_MS = 24 * 60 * 60 * 1000;
const DELAY_MS = 7000;

/**
 * Banner sorpresa de la promoción del cupón: aparece una vez al día,
 * unos segundos después de entrar (y solo con la edad confirmada y sin
 * otra capa abierta). Un toque lleva al catálogo.
 */
export default function PromoPopup() {
  const t = useT();
  const pathname = usePathname();
  const { drawerOpen, checkoutOpen, quickProduct, addressOpen, ageVerified } = useUi();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (pathname === "/admin" || pathname === "/order-success" || pathname === "/pedido") return;
    try {
      const last = Number(window.localStorage.getItem(SEEN_KEY) || 0);
      if (Date.now() - last < EVERY_MS) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => {
      // Con el portal de edad todavía abierto no se muestra.
      const ageOk = ageVerified || (() => { try { return window.localStorage.getItem(AGE_KEY) === "1"; } catch { return false; } })();
      if (!ageOk) return;
      setShow(true);
      try {
        window.localStorage.setItem(SEEN_KEY, String(Date.now()));
      } catch {
        /* noop */
      }
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname, ageVerified]);

  const blocked = drawerOpen || checkoutOpen || quickProduct !== null || addressOpen;
  if (!show || blocked) return null;

  function go() {
    setShow(false);
    if (pathname === "/") scrollToSection("catalogo");
    else window.location.assign("/#catalogo");
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm fade-overlay sm:items-center sm:p-6" onClick={() => setShow(false)} role="dialog" aria-modal="true" aria-label={t("promo.popTitle").replace("{usd}", String(LOYALTY_COUPON_USD))}>
      <div onClick={(e) => e.stopPropagation()} className="modal-pop relative w-full max-w-md overflow-hidden rounded-[24px] border border-gold-400/40 bg-[#0A0A0A] p-7 text-center shadow-pop sm:p-9">
        <span className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gold-400/20 blur-3xl" aria-hidden />
        <button onClick={() => setShow(false)} aria-label="Cerrar" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink-500 transition hover:bg-white/5 hover:text-ink-50">
          <X className="h-4 w-4" />
        </button>

        <span className="check-ring relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-400 text-ink-900">
          <Gift className="h-7 w-7" />
        </span>
        <p className="kicker rise mt-6 justify-center" style={{ "--i": 1 } as React.CSSProperties}>{t("promo.popKicker")}</p>
        <h2 className="rise mt-3 font-display text-[30px] font-bold uppercase leading-[0.95] tracking-tightest text-ink-50 sm:text-[36px]" style={{ "--i": 2 } as React.CSSProperties}>
          {t("promo.popTitle").replace("{usd}", String(LOYALTY_COUPON_USD))}
        </h2>
        <p className="rise mx-auto mt-4 max-w-xs text-[14px] leading-relaxed text-ink-300" style={{ "--i": 3 } as React.CSSProperties}>
          {t("promo.popBody").replace("{n}", String(LOYALTY_EVERY)).replace("{usd}", String(LOYALTY_COUPON_USD))}
        </p>

        <div className="rise mt-6 flex justify-center gap-2" style={{ "--i": 4 } as React.CSSProperties} aria-hidden>
          {Array.from({ length: LOYALTY_EVERY }, (_, i) => (
            <span key={i} className="badge-pop grid h-10 w-10 place-items-center rounded-full border border-gold-400/50 font-display text-[14px] font-bold text-gold-200" style={{ animationDelay: `${500 + i * 120}ms` }}>
              {i + 1}
            </span>
          ))}
          <span className="badge-pop grid h-10 min-w-[64px] place-items-center rounded-full bg-gold-400 px-3 font-display text-[14px] font-bold text-ink-900" style={{ animationDelay: `${500 + LOYALTY_EVERY * 120}ms` }}>
            ${LOYALTY_COUPON_USD}
          </span>
        </div>

        <button onClick={go} className="btn-gold rise mt-7 w-full" style={{ "--i": 5 } as React.CSSProperties}>
          {t("promo.popCta")}
        </button>
        <p className="rise mt-3 text-[11.5px] text-ink-500" style={{ "--i": 6 } as React.CSSProperties}>{t("promo.popNote")}</p>
      </div>
    </div>
  );
}
