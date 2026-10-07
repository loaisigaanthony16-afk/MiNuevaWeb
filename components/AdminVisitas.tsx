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
  recorridos: Sesion[];
}

interface Paso {
  hora: string;
  tipo: string;
  ruta: string;
  dato: Record<string, unknown> | null;
}

interface Sesion {
  sesion: string;
  inicio: string;
  segundos: number;
  pais: string;
  dispositivo: string;
  origen: string;
  vistas: number;
  agrego: boolean;
  compro: boolean;
  pasos: Paso[];
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
  producto: "Miraron un sabor",
  carrito: "Agregaron al carrito",
  checkout: "Abrieron el pago",
  pedido: "Pagaron",
};

/** Cómo se lee cada paso dentro de un recorrido. */
const ACCION: Record<string, string> = {
  vista: "abrió",
  producto: "miró la ficha de",
  buscar: "buscó",
  filtro: "filtró",
  reel: "vio el reel",
  carrito: "agregó al carrito",
  checkout: "pidió pagar",
  pedido: "pagó",
  contacto: "tocó contacto",
  edad_no: "dijo que no tiene 21",
  salida: "se fue de",
};

/** El detalle de la derecha: lo que da contexto al paso. */
function detalle(p: Paso): string {
  const d = p.dato ?? {};
  if (p.tipo === "buscar") return `“${d.texto}” · ${d.resultados} resultados`;
  if (p.tipo === "filtro") return `marca ${d.marca} · tipo ${d.tipo}`;
  if (p.tipo === "salida") {
    const s = Number(d.segundos ?? 0);
    const tiempo = s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`;
    return `${p.ruta} · ${tiempo} · bajó hasta el ${d.fondo}%`;
  }
  if (typeof d.slug === "string") return d.slug;
  return p.ruta;
}

function duracion(segundos: number): string {
  if (segundos < 60) return `${segundos} s`;
  const m = Math.floor(segundos / 60);
  return `${m} min ${segundos % 60} s`;
}

/** Un recorrido: qué hizo esa visita, en orden. */
function Recorrido({ s }: { s: Sesion }) {
  return (
    <details className="group border-b border-[#1c1c1c] last:border-0">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-[12.5px] hover:bg-white/[0.02]">
        <span className="tabular-nums text-ink-500">{s.inicio.slice(5)}</span>
        <span className="text-ink-50">{ORIGEN_LABEL[s.origen] ?? s.origen}</span>
        <span className="text-ink-500">
          {s.pais} · {s.dispositivo}
        </span>
        <span className="ml-auto flex items-center gap-2 text-ink-400">
          {s.compro ? (
            <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[11px] text-gold-300">Compró</span>
          ) : s.agrego ? (
            <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] text-ink-300">Al carrito</span>
          ) : null}
          <span className="tabular-nums">{s.pasos.length} pasos</span>
          <span className="tabular-nums text-ink-600">{duracion(s.segundos)}</span>
          <span className="text-ink-600 transition group-open:rotate-180">▾</span>
        </span>
      </summary>
      <ol className="space-y-1 border-t border-[#1c1c1c] bg-black/20 px-4 py-3">
        {s.pasos.map((p, i) => (
          <li key={i} className="flex items-baseline gap-3 text-[12px]">
            <span className="tabular-nums text-ink-600">{p.hora}</span>
            <span className="w-[150px] shrink-0 text-ink-300">{ACCION[p.tipo] ?? p.tipo}</span>
            <span className="truncate text-ink-500">{detalle(p)}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

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
  const pasos = ["vista", "producto", "carrito", "checkout", "pedido"];
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

      <div className="overflow-hidden rounded-[20px] border border-[#262626]">
        <div className="flex items-baseline justify-between px-4 pb-1 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide2 text-ink-500">
            Recorridos · uno por visita
          </p>
          <p className="text-[11px] text-ink-600">Tocá uno para ver qué hizo</p>
        </div>
        {data.recorridos.length === 0 ? (
          <p className="px-4 pb-4 text-[12.5px] text-ink-600">Todavía no entró nadie.</p>
        ) : (
          <div className="mt-2">
            {data.recorridos.map((s) => (
              <Recorrido key={s.sesion + s.inicio} s={s} />
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-ink-600">
        Sin cookies ni datos personales: ruta, origen, país y un número al azar por sesión que se borra al
        cerrar la pestaña. Cada recorrido es una pestaña abierta, no una persona identificada: si vuelve
        mañana aparece como otro recorrido y no hay forma de saber que es la misma.
      </p>
    </div>
  );
}
