import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de entregas · Vibe 505",
  description: "Cobertura, costo y coordinación de entregas de Vibe 505 en Estelí.",
};

const sections: LegalSection[] = [
  {
    title: "Cobertura",
    body: [
      `Por ahora entregamos únicamente dentro de ${LEGAL.zone}, ${LEGAL.country}. No hacemos envíos a otros departamentos ni al exterior.`,
      `Si pagaste un pedido con una dirección fuera de ${LEGAL.zone}, te devolvemos el total.`,
    ],
  },
  {
    title: "Costo",
    body: [
      `La entrega cuesta C$${LEGAL.deliveryFeeNio} por pedido (US$${LEGAL.deliveryFeeUsd.toFixed(2)}), sin importar la cantidad de productos. Se cobra junto con el pedido.`,
    ],
  },
  {
    title: "Cómo se coordina",
    body: [
      [
        "Al confirmarse el pago se abre el chat de tu pedido y tus datos de entrega se envían por ahí.",
        "Con esos datos acordamos el día y la franja horaria de entrega.",
        "Te avisamos por el chat cuando el pedido sale.",
      ],
      "No tenés que dar tu nombre real: basta con un nombre o apodo para recibir y un teléfono de contacto.",
    ],
  },
  {
    title: "Empaque",
    body: ["Entregamos en empaque neutro y sellado, sin marcas ni referencias al contenido en el exterior."],
  },
  {
    title: "Al recibir",
    body: [
      `Quien recibe el pedido debe ser mayor de ${LEGAL.minAge} años. Si hay motivos para creer que no lo es, no entregamos y reembolsamos el pedido.`,
      "Revisá que los productos coincidan con tu pedido y avisanos en ese momento por el chat si falta algo o llegó dañado.",
    ],
  },
  {
    title: "Si no se puede entregar",
    body: [
      "Si no hay nadie para recibir o la dirección no es correcta, te escribimos para reprogramar sin costo adicional.",
      "Si después de dos intentos acordados no es posible entregar y no hay respuesta en el chat durante 7 días, cancelamos el pedido y devolvemos el importe de los productos. El costo de entrega no se devuelve en ese caso.",
    ],
  },
];

export default function Shipping() {
  return (
    <LegalPage
      path="/shipping"
      kicker="Legal"
      title="Política de entregas"
      intro={`Entregamos solo en ${LEGAL.zone}. Así funciona.`}
      sections={sections}
    />
  );
}
