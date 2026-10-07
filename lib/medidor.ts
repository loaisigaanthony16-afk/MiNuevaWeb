// =====================================================================
// Avisos al contador propio (/api/visita).
//
// La atribución se guarda al entrar y se conserva durante la sesión: si
// alguien llega desde Instagram y después recorre cinco páginas, las
// cinco siguen contando como Instagram. Si no, todo el tráfico de redes
// aparecería como "directo" salvo la primera página.
//
// Todo vive en sessionStorage: se borra al cerrar la pestaña, no es una
// cookie y no sigue a nadie entre visitas.
// =====================================================================

const SESION = "vibeSesion";
const ORIGEN = "vibeOrigen";

type Origen = {
  referencia?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

function leer(clave: string): string | null {
  try {
    return window.sessionStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardar(clave: string, valor: string) {
  try {
    window.sessionStorage.setItem(clave, valor);
  } catch {
    // Modo privado o almacenamiento bloqueado: se cuenta igual, sin sesión.
  }
}

/** Id aleatorio de sesión. No identifica a nadie: es un número al azar. */
function sesion(): string {
  const previo = leer(SESION);
  if (previo) return previo;
  const nuevo =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  guardar(SESION, nuevo);
  return nuevo;
}

/**
 * De dónde viene esta sesión. Se calcula una sola vez, en la primera
 * página, cuando el referrer y los utm todavía están en la URL.
 */
function origen(): Origen {
  const previo = leer(ORIGEN);
  if (previo) {
    try {
      return JSON.parse(previo) as Origen;
    } catch {
      // Dato corrupto: se recalcula.
    }
  }

  const q = new URLSearchParams(window.location.search);
  const o: Origen = {
    referencia: document.referrer || undefined,
    utm_source: q.get("utm_source") ?? undefined,
    utm_medium: q.get("utm_medium") ?? undefined,
    utm_campaign: q.get("utm_campaign") ?? undefined,
  };
  guardar(ORIGEN, JSON.stringify(o));
  return o;
}

/**
 * Manda un aviso. `tipo` es "vista" para una página o un paso del
 * embudo: "carrito", "checkout", "pedido", "contacto".
 *
 * Usa sendBeacon cuando existe: así el aviso sale aunque la persona
 * cierre la pestaña en ese mismo instante, que es justo cuando se perdía
 * el dato más interesante.
 */
export function marcar(tipo: string, dato?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const cuerpo = JSON.stringify({
    tipo,
    ruta: window.location.pathname,
    sesion: sesion(),
    ...origen(),
    dato,
  });

  try {
    // sendBeacon devuelve false si la cola está llena o el navegador
    // rechaza el tipo: en ese caso hay que seguir al fetch, no darlo por
    // enviado.
    if (navigator.sendBeacon?.("/api/visita", new Blob([cuerpo], { type: "application/json" }))) {
      return;
    }
  } catch {
    // Algunos navegadores lanzan en vez de devolver false.
  }

  void fetch("/api/visita", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: cuerpo,
    keepalive: true,
  }).catch(() => {});
}
