import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos y condiciones · Vibe 505",
  description: "Términos y condiciones de compra en Vibe 505.",
};

const sections: LegalSection[] = [
  {
    title: "Quiénes somos",
    body: [
      `${LEGAL.brand} es una tienda en línea que funciona en ${LEGAL.site}. Vendemos vapes desechables y entregamos únicamente dentro de ${LEGAL.zone}, ${LEGAL.country}.`,
      `Nuestro canal de atención es WhatsApp: ${LEGAL.whatsappDisplay}. Al usar el sitio o comprar aceptás estos términos.`,
    ],
  },
  {
    title: "Solo mayores de 21 años",
    body: [
      `El sitio y los productos son exclusivamente para personas de ${LEGAL.minAge} años o más. Para entrar confirmás tu edad y, antes de pagar, volvés a confirmarla.`,
      `Si tenemos motivos para creer que quien compra o recibe es menor de ${LEGAL.minAge} años, cancelamos el pedido y devolvemos el dinero.`,
      "Sos responsable de conocer y cumplir la normativa que aplica en tu lugar de residencia antes de comprar.",
    ],
  },
  {
    title: "Productos",
    body: [
      "Vendemos vapes desechables de las marcas que figuran en el catálogo. Las fotos corresponden a nuestro inventario real; el empaque puede variar levemente entre lotes.",
      "La disponibilidad depende del inventario. Si un sabor se agota después de tu pago, te ofrecemos otro o te devolvemos ese producto.",
      "Son productos de uso adulto. Usalos con responsabilidad y lejos del alcance de menores.",
    ],
  },
  {
    title: "Precios y pagos",
    body: [
      [
        "Los precios están en dólares estadounidenses (USD). Los montos en córdobas son solo de referencia, calculados a una tasa de C$" + LEGAL.exchangeRate + " por dólar.",
        `A cada pedido se suma la entrega en ${LEGAL.zone}: C$${LEGAL.deliveryFeeNio} (US$${LEGAL.deliveryFeeUsd.toFixed(2)}).`,
        "El precio con descuento que ves al pagar es el que se cobra. El total final aparece antes de confirmar el pago.",
        `Los pagos con tarjeta los procesa ${LEGAL.paymentProcessor}. No vemos ni guardamos los datos de tu tarjeta.`,
        "El cargo puede figurar en tu estado de cuenta con el nombre del comercio registrado ante el procesador de pagos.",
      ],
    ],
  },
  {
    title: "Pedido y confirmación",
    body: [
      "Tu pedido queda confirmado cuando el pago se acredita. Te mostramos una referencia con el formato VIBE-XXXX.",
      "Para entregarlo necesitamos tus datos de entrega: al terminar de pagar te pedimos enviarlos por WhatsApp. Sin ese paso no podemos despachar.",
    ],
  },
  {
    title: "Cancelaciones",
    body: [
      "Podés cancelar un pedido pagado escribiéndonos por WhatsApp antes de que salga a entrega. En ese caso te devolvemos el total. Los detalles están en la Política de reembolsos.",
    ],
  },
  {
    title: "Opiniones públicas",
    body: [
      "Las opiniones y respuestas que publicás son visibles para cualquier persona. No compartas teléfonos, direcciones, enlaces ni datos de terceros.",
      "Podemos ocultar contenido ofensivo, engañoso, con datos personales o que no tenga relación con la tienda.",
    ],
  },
  {
    title: "Responsabilidad",
    body: [
      "Hacemos lo posible para que la información del sitio sea correcta y esté disponible, pero puede haber errores o interrupciones. Si detectamos un error de precio evidente antes de entregar, te avisamos y podés confirmar o cancelar con reembolso total.",
      "No respondemos por el uso indebido de los productos ni por daños derivados de usarlos de forma distinta a la indicada por el fabricante.",
    ],
  },
  {
    title: "Cambios en estos términos",
    body: [
      "Podemos actualizar estos términos. La versión vigente es la publicada en esta página, con su fecha de actualización. Los pedidos ya pagados se rigen por los términos vigentes al momento de la compra.",
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      path="/terms"
      kicker="Legal"
      title="Términos y condiciones"
      intro={`Las reglas para comprar en ${LEGAL.brand}, escritas de forma directa.`}
      sections={sections}
    />
  );
}
