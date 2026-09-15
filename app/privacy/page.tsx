import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad · Vibe 505",
  description: "Qué datos usa Vibe 505, dónde quedan y cómo borrarlos.",
};

const sections: LegalSection[] = [
  {
    title: "Resumen",
    body: [
      "No tenés que crear una cuenta. Tu dirección de entrega no se guarda en nuestros servidores: queda en tu dispositivo y nos llega solo por el chat cifrado de tu pedido.",
    ],
  },
  {
    title: "Datos que se quedan en tu dispositivo",
    body: [
      "El sitio guarda en el almacenamiento local de tu navegador:",
      [
        "La bolsa de compras.",
        "Los datos de entrega que escribís (apodo, teléfono, dirección y referencias).",
        "La confirmación de edad (también en una cookie con ese único fin).",
        "Preferencias como el idioma, el apodo que usaste en opiniones y los “me gusta” de los reels.",
        "El acceso al chat de tu último pedido, para que puedas volver a la conversación.",
      ],
      "Estos datos no se envían a nuestros servidores. Podés borrar la dirección desde el formulario de entrega (“Borrar mis datos”) o limpiando los datos del sitio en tu navegador.",
    ],
  },
  {
    title: "Datos que recibimos",
    body: [
      [
        "Pedidos: referencia, productos, cantidades, importes, estado del pago y el identificador de la sesión de pago. No guardamos nombre, teléfono ni dirección junto al pedido.",
        "Chat del pedido: los datos de entrega que enviás y la conversación para coordinarla. Se guardan cifrados y se borran cuando el pedido se entrega.",
        "Opiniones: el apodo, la calificación y el texto que publicás, que son públicos. No guardamos tu dirección IP con la opinión.",
        "Registros técnicos: nuestro proveedor de alojamiento registra datos técnicos básicos de las visitas (por ejemplo, fecha, página y dirección IP) por seguridad y funcionamiento.",
      ],
    ],
  },
  {
    title: "Pagos",
    body: [
      `Los pagos los procesa ${LEGAL.paymentProcessor}. Para cobrar, ${LEGAL.paymentProcessor} recibe los datos de tu tarjeta, el nombre del titular, tu correo electrónico y tu país, y los trata según su propia política de privacidad. Nosotros no vemos ni guardamos los datos de tu tarjeta.`,
    ],
  },
  {
    title: "Proveedores que intervienen",
    body: [
      [
        "Vercel: alojamiento del sitio.",
        "Supabase: base de datos de pedidos y opiniones.",
        `${LEGAL.paymentProcessor}: procesamiento de pagos con tarjeta.`,
              ],
      "No vendemos tus datos ni los usamos para publicidad. No usamos cookies de publicidad ni de rastreo de terceros.",
    ],
  },
  {
    title: "Conservación",
    body: [
      "Guardamos los registros de pedidos el tiempo necesario para gestionarlos, atender reembolsos o reclamos y cumplir obligaciones contables. La conversación del pedido se borra automáticamente al marcarlo como entregado.",
    ],
  },
  {
    title: "Tus derechos",
    body: [
      `Podés pedirnos por el chat de tu pedido que te informemos qué datos tenemos sobre un pedido tuyo, que los corrijamos o que los eliminemos, salvo los que debamos conservar por obligaciones legales o contables. También podés pedir que eliminemos una opinión que publicaste.`,
    ],
  },
  {
    title: "Menores de edad",
    body: [
      `El sitio es solo para mayores de ${LEGAL.minAge} años. No recibimos a sabiendas datos de menores; si detectamos que ocurrió, los eliminamos.`,
    ],
  },
  {
    title: "Cambios en esta política",
    body: ["Si cambiamos cómo tratamos los datos, actualizamos esta página y su fecha."],
  },
];

export default function Privacy() {
  return (
    <LegalPage
      path="/privacy"
      kicker="Legal"
      title="Política de privacidad"
      intro="Qué datos usamos, dónde quedan y cómo podés borrarlos."
      sections={sections}
    />
  );
}
