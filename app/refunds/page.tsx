import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de reembolsos · Vibe 505",
  description: "Cancelaciones, productos defectuosos y reembolsos en Vibe 505.",
};

const sections: LegalSection[] = [
  {
    title: "Cuándo devolvemos el total",
    body: [
      [
        "Cancelás el pedido por WhatsApp antes de que salga a entrega.",
        `La dirección está fuera de ${LEGAL.zone} y no podemos entregar.`,
        "No tenemos stock de lo que pagaste y no aceptás un reemplazo.",
        `Cancelamos el pedido porque quien compra o recibe no parece tener ${LEGAL.minAge} años o más.`,
        "Hubo un error evidente de precio y decidís no continuar.",
      ],
    ],
  },
  {
    title: "Productos defectuosos o incorrectos",
    body: [
      "Si un producto no funciona, llega dañado o no es el que pediste, escribinos por WhatsApp dentro de las 48 horas de recibirlo con una foto o video y tu referencia VIBE-XXXX.",
      "Te lo reemplazamos por el mismo sabor (u otro, si ese no está disponible) o te devolvemos el importe de ese producto, como prefieras.",
    ],
  },
  {
    title: "Qué no se puede devolver",
    body: [
      "Por higiene y seguridad, no aceptamos devoluciones de productos abiertos o usados que funcionan correctamente, ni cambios por preferencia de sabor después de la entrega.",
    ],
  },
  {
    title: "Cómo se hace el reembolso",
    body: [
      `Devolvemos el dinero al mismo medio de pago, a través de ${LEGAL.paymentProcessor}. Iniciamos el reembolso dentro de 3 días hábiles desde que lo aprobamos; tu banco puede tardar de 5 a 10 días hábiles más en reflejarlo.`,
      "El costo de entrega se devuelve cuando el pedido no llegó a entregarse por una causa nuestra.",
    ],
  },
  {
    title: "Antes de un contracargo",
    body: [
      `Si ves un cargo que no reconocés o tuviste un problema con tu pedido, escribinos primero al ${LEGAL.whatsappDisplay}. Lo resolvemos más rápido que un reclamo con tu banco.`,
    ],
  },
];

export default function Refunds() {
  return (
    <LegalPage
      path="/refunds"
      kicker="Legal"
      title="Política de reembolsos"
      intro="Cuándo devolvemos tu dinero y cómo pedirlo."
      sections={sections}
    />
  );
}
