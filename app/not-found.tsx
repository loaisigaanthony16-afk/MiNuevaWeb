import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export default function NotFound() {
  return (
    <main className="container-page grid min-h-[80vh] place-items-center py-16">
      <div className="modal-pop w-full max-w-md text-center">
        <div className="flex justify-center">
          <Wordmark />
        </div>
        <p className="kicker rise mt-10 justify-center">404</p>
        <h1 className="rise mt-4 font-display text-[26px] font-semibold uppercase tracking-tightest text-ink-50" style={{ "--i": 1 } as React.CSSProperties}>
          Esta página no existe
        </h1>
        <p className="rise mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-400" style={{ "--i": 2 } as React.CSSProperties}>
          El enlace puede estar mal escrito o la página ya no está.
        </p>
        <div className="rise mt-8 grid gap-3 sm:grid-cols-2" style={{ "--i": 3 } as React.CSSProperties}>
          <Link href="/#catalogo" className="btn-gold w-full">Ver el catálogo</Link>
          <Link href="/pedido" className="btn-ghost w-full">Mi pedido</Link>
        </div>
      </div>
    </main>
  );
}
