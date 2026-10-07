"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Resumen {
  dias: number;
  vistas: number;
  sesiones: number;
  hoy: number;
  por_dia: { dia: string; vistas: number; sesiones: number }[];
  paginas: { ruta: string; vistas: number }[];
  origenes: { origen: string; vistas: number }[];
  paises: { pais: string; vistas: number }[];
  dispositivos: { dispositivo: string; vistas: number }[];
  embudo: Record<string, number>;
}

const DIAS = [7, 30, 90];

/**
 * Nombres legibles. Las claves son las que ya normalizó la base
 * (visitas_origen), no el host crudo: ahí "instagram.com", "l.instagram.com"
 * y el utm "instagram" ya llegaron reducidos a "instagram".
 */
const ORIGEN_LABEL: Record<string, string> = {
  directo: "Directo o app",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  google: "Búsqueda de Google",
  bing: "Búsqueda de Bing",
  duckduckgo: "Búsqueda de DuckDuckGo",
  youtube: "YouTube",
  x: "X / Twitter",
};

const PASO_LABEL: Record<string, string> = {
  vista: "Entraron al sitio",
  carrito: "Agregaron al carrito",
  checkout: "Abrieron el pago",
  pedido: "Pagaron",
};

function Barras({ datos }: { datos: Resumen["por_dia"] }) {
  if (datos.length === 0) return null;
  const max = Math.max(...datos.map((d) => d.vistas), 1);
  // Solo los últimos 30 días: más barras no se distinguen en el celular.
  const vista = datos.slice(-30);

  return (
    <div className="rounded-[20px] border border-[#262626] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide2 text-ink-500">Vistas por día</p>
      <div className="mt-4 flex h-28 items-end gap-[3px]">
        {vista.map((d) => (
          <div
            key={d.dia}
            title={`${d.dia}: ${d.vistas} vistas · ${d.sesiones} visitantes`}
            className="flex-1 rounded-t-[3px] bg-gold-400/80 transition hover:bg-gold-300"
            style={{ height: `${Math.max(2, (d.vistas / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10.5px] text-ink-600">
        <span>{vista[0]?.dia}</span>
        <span>{vista[vista.length - 1]?.dia}</span>
      </div>
    </div>
  );
}

function Lista({
  titulo,
  filas,
  nota,
}: {
  titulo: string;
  filas: { etiqueta: string; valor: number }[];
  nota?: string;
}) {
  const max = Math.max(...filas.map((f) => f.valor), 1);
  return (
    <div className="rounded-[20px] border border-[#262626] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide2 text-ink-500">{titulo}</p>
      {filas.length === 0 ? (
        <p className="mt-3 text-[12.5px] text-ink-600">Sin datos todavía.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {filas.map((f) => (
            <li key={f.etiqueta} className="relative">
              {/* La barra de fondo deja comparar de un vistazo sin leer números. */}
              <span
                className="absolute inset-y-0 left-0 rounded-[4px] bg-white/[0.06]"
                style={{ width: `${(f.valor / max) * 100}%` }}
              />
              <span className="relative flex items-baseline justify-between gap-3 px-2 py-1 text-[12.5px]">
                <span className="truncate text-ink-300">{f.etiqueta}</span>
                <span className="tabular-nums text-ink-50">{f.valor}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {nota && <p className="mt-3 text-[11px] text-ink-600">{nota}</p>}
    </div>
  );
}

/**
 * Visitas al sitio: cuántas, de dónde vienen y cuántas terminan en
 * pedido. Los datos son de nuestra propia base, no de un servicio
 * externo, así que no caducan ni tienen límite de eventos.
 */
export default function AdminVisitas({ headers }: { headers: () => Record<string, string> }) {
  const [dias, setDias] = useState(30);
  const [data, setData] = useState<Resumen | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    fetch(`/api/admin/visitas?dias=${dias}`, { headers: headers(), cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("No se pudieron cargar las visitas.");
        return (await r.json()) as Resumen;
      })
      .then((d) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [headers, dias]);

  const selector = (
    <div className="flex gap-1 rounded-full border border-white/10 p-1">
      {DIAS.map((d) => (
        <button
          key={d}
          onClick={() => setDias(d)}
          className={`h-8 rounded-full px-3.5 text-[11.5px] font-bold uppercase tracking-[0.08em] transition ${
            dias === d ? "bg-ink-50 text-ink-900" : "text-ink-400 hover:text-ink-50"
          }`}
        >
          {d} días
        </button>
      ))}
    </div>
  );

  if (error) return <p className="text-[13px] text-red-400">{error}</p>;

  if (!data)
    return (
      <div className="space-y-4">
        {selector}
        <p className="flex items-center gap-2 text-[13px] text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      </div>
    );

  const pedidos = data.embudo.pedido ?? 0;
  const conversion = data.sesiones > 0 ? (pedidos / data.sesiones) * 100 : 0;

  const kpis: [string, string, string][] = [
    ["Vistas de página", String(data.vistas), `en ${data.dias} días`],
    ["Visitantes", String(data.sesiones), "sesiones distintas"],
    ["Hoy", String(data.hoy), "vistas desde las 00:00"],
    ["Convierten", `${conversion.toFixed(1)}%`, `${pedidos} pedidos`],
  ];

  // El embudo solo tiene sentido en orden; los pasos que faltan van en 0.
  const pasos = ["vista", "carrito", "checkout", "pedido"];
  const tope = data.embudo.vista ?? 0;

  return (
    <div className="space-y-5">
      {selector}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(([titulo, valor, pie], i) => (
          <div
            key={titulo}
            className="row-in rounded-[20px] border border-[#262626] p-5"
            style={{ "--i": i } as React.CSSProperties}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide2 text-ink-500">{titulo}</p>
            <p className="mt-2 font-display text-[28px] font-bold tabular-nums text-gold-gradient">{valor}</p>
            <p className="mt-1 text-[12.5px] text-ink-400">{pie}</p>
          </div>
        ))}
      </div>

      <Barras datos={data.por_dia} />

      <div className="rounded-[20px] border border-[#262626] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide2 text-ink-500">Del clic al pedido</p>
        <ul className="mt-3 space-y-2">
          {pasos.map((paso) => {
            const n = data.embudo[paso] ?? 0;
            return (
              <li key={paso} className="relative">
                <span
                  className="absolute inset-y-0 left-0 rounded-[4px] bg-gold-400/15"
                  style={{ width: `${tope > 0 ? (n / tope) * 100 : 0}%` }}
                />
                <span className="relative flex items-baseline justify-between gap-3 px-2 py-1.5 text-[12.5px]">
                  <span className="text-ink-300">{PASO_LABEL[paso]}</span>
                  <span className="tabular-nums text-ink-50">
                    {n}
                    {tope > 0 && paso !== "vista" && (
                      <span className="ml-2 text-ink-500">{((n / tope) * 100).toFixed(1)}%</span>
                    )}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Lista
          titulo="De dónde llegan"
          filas={data.origenes.map((o) => ({
            etiqueta: ORIGEN_LABEL[o.origen] ?? o.origen,
            valor: o.vistas,
          }))}
          nota="«Búsqueda de Google» son visitas que llegaron buscando. Las palabras exactas que buscaron solo las muestra Search Console."
        />
        <Lista
          titulo="Páginas más vistas"
          filas={data.paginas.map((p) => ({ etiqueta: p.ruta, valor: p.vistas }))}
        />
        <Lista titulo="Países" filas={data.paises.map((p) => ({ etiqueta: p.pais, valor: p.vistas }))} />
        <Lista
          titulo="Dispositivos"
          filas={data.dispositivos.map((d) => ({ etiqueta: d.dispositivo, valor: d.vistas }))}
        />
      </div>

      <p className="text-[11px] text-ink-600">
        Sin cookies ni datos personales: ruta, origen, país y un número al azar por sesión que se borra al
        cerrar la pestaña.
      </p>
    </div>
  );
}
