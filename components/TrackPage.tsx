"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import Wordmark from "@/components/Wordmark";
import OrderStepper from "@/components/OrderStepper";
import { useT } from "@/components/locale-context";
import { FULFILLMENT_NOTICE, type Fulfillment } from "@/lib/fulfillment";

interface Track {
  orderId: string;
  fulfillment: Fulfillment;
  updatedAt: string | null;
}

/** /seguir?ref=VIBE-XXXX: solo el estado de entrega, para compartir. */
export default function TrackPage() {
  const t = useT();
  const [ref, setRef] = useState("");
  const [result, setResult] = useState<Track | null | "none">(null);
  const [busy, setBusy] = useState(false);

  async function lookup(id: string) {
    const clean = id.trim().toUpperCase();
    if (!/^VIBE-[A-Z0-9]{4,20}$/.test(clean)) {
      setResult("none");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/track/${clean}`, { cache: "no-store" });
      setResult(res.ok ? ((await res.json()) as Track) : "none");
    } catch {
      setResult("none");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("ref");
    if (q) {
      setRef(q.toUpperCase());
      void lookup(q);
    }
  }, []);

  // Se refresca solo mientras la página esté abierta.
  useEffect(() => {
    if (!result || result === "none") return;
    const id = setInterval(() => void lookup(result.orderId), 20000);
    return () => clearInterval(id);
  }, [result]);

  return (
    <section className="container-page max-w-lg py-8 sm:py-14">
      <div className="mb-7 flex justify-center">
        <Wordmark />
      </div>
      <div className="text-center">
        <p className="kicker rise justify-center">{t("track.kicker")}</p>
        <h1 className="rise mt-3 font-display text-[26px] font-semibold uppercase tracking-tightest text-ink-50" style={{ "--i": 1 } as React.CSSProperties}>
          {t("track.title")}
        </h1>
        <p className="rise mx-auto mt-2 max-w-sm text-[13.5px] text-ink-400" style={{ "--i": 2 } as React.CSSProperties}>
          {t("track.body")}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void lookup(ref);
          }}
          className="rise mt-6 flex gap-2"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value.toUpperCase())}
            placeholder={t("track.placeholder")}
            autoCapitalize="characters"
            spellCheck={false}
            className="field font-mono uppercase"
          />
          <button type="submit" disabled={busy} className="btn-gold shrink-0 px-5" aria-label={t("track.button")}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </form>

        {result === "none" && <p className="mt-5 text-[13px] text-red-400">{t("track.notFound")}</p>}

        {result && result !== "none" && (
          <div className="chat-card mt-6 rounded-2xl border border-[#262626] bg-[#0A0A0A] p-5">
            <p className="font-display text-[22px] font-bold tracking-tight text-gold-gradient">{result.orderId}</p>
            <div className="mt-5">
              <OrderStepper current={result.fulfillment} />
            </div>
            <p className="mt-5 text-[14px] text-ink-100">{FULFILLMENT_NOTICE[result.fulfillment]}</p>
            {result.updatedAt && (
              <p className="mt-1 text-[11.5px] text-ink-500">
                {t("track.updated")} {new Date(result.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <Link href="/" className="btn-ghost rise mt-8 w-full" style={{ "--i": 5 } as React.CSSProperties}>
          {t("order.done")}
        </Link>
      </div>
    </section>
  );
}
