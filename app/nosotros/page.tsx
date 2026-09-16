import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Nosotros · Vibe 505",
  description: "Quiénes somos y cómo cuidamos tu privacidad en cada pedido en Estelí.",
};

const PILLARS = [
  {
    n: "01",
    title: "Sin cuenta, sin nombre",
    body: "No te pedimos registrarte ni un correo. Elegís, pagás con tarjeta y listo. Lo único que necesitamos para entregarte es la dirección y un teléfono, y eso lo mandás vos por el chat cifrado de tu pedido.",
  },
  {
    n: "02",
    title: "Tu dirección nunca toca nuestros servidores en claro",
    body: "Los datos de entrega viven en tu teléfono hasta que los enviás por el chat. Ahí viajan cifrados y en la base quedan ilegibles. Al entregar el pedido, la conversación se borra completa.",
  },
  {
    n: "03",
    title: "Empaque neutro",
    body: "Recibís una caja o sobre sin marcas, sin logos y sin ninguna referencia al contenido. Nadie que lo vea sabe qué es.",
  },
  {
    n: "04",
    title: "Pago por un procesador, no por nosotros",
    body: `El cobro lo procesa ${LEGAL.paymentProcessor}. Nunca vemos ni guardamos los datos de tu tarjeta: solo sabemos que el pedido quedó pagado.`,
  },
  {
    n: "05",
    title: "Entrega en Estelí, en persona",
    body: `Solo entregamos en ${LEGAL.zone}. Coordinamos la hora por el chat y te avisamos cuando el mensajero sale. Podés seguir el estado del pedido en cualquier momento.`,
  },
  {
    n: "06",
    title: "Solo mayores de 21",
    body: `Vendemos exclusivamente a personas de ${LEGAL.minAge} años o más. Lo confirmás antes de pagar y el mensajero puede pedir identificación al entregar.`,
  },
];

export default function Nosotros() {
  return (
    <main id="top">
      <Navbar />
      <article className="container-page max-w-3xl pb-24 pt-14 sm:pt-20">
        <p className="kicker rise">
          <span className="h-px w-8 bg-gold-400/60" />
          Nosotros
        </p>
        <h1 className="display-lg rise mt-5 text-ink-50" style={{ "--i": 1 } as React.CSSProperties}>
          Discreción como regla, no como promesa.
        </h1>
        <p className="rise mt-5 max-w-2xl text-[15.5px] leading-relaxed text-ink-300" style={{ "--i": 2 } as React.CSSProperties}>
          Vibe 505 es una tienda pequeña de Estelí. Vendemos vapes desechables de marcas premium y armamos todo el proceso
          alrededor de una sola idea: que comprar sea tan fácil como pedir cualquier cosa por internet, y tan privado como
          comprar en efectivo.
        </p>

        <div className="mt-12 space-y-8">
          {PILLARS.map((p, i) => (
            <section key={p.n} className="rise border-t border-[#262626] pt-7" style={{ "--i": 3 + i } as React.CSSProperties}>
              <h2 className="font-display text-[18px] font-semibold uppercase tracking-[0.06em] text-ink-50">
                <span className="mr-3 font-mono text-[13px] text-gold-300">{p.n}</span>
                {p.title}
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-300">{p.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2">
          <Link href="/#catalogo" className="btn-gold w-full">Ver el catálogo</Link>
          <Link href="/privacy" className="btn-ghost w-full">Política de privacidad completa</Link>
        </div>
      </article>
      <Footer />
    </main>
  );
}
