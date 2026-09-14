import { NextResponse } from "next/server";
import { getOrderStatus, isOrderId } from "@/lib/orders";

/**
 * Estado de un pedido, para la consulta periódica del modal y de la
 * página de confirmación. Devuelve solo el estado y el total: nada que
 * identifique a la persona.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  if (!isOrderId(orderId)) {
    return NextResponse.json({ error: "Referencia inválida." }, { status: 400 });
  }

  try {
    const result = await getOrderStatus(orderId);
    return NextResponse.json(result, {
      status: result.status === "not_found" ? 404 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("Error leyendo el pedido:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ status: "unknown" }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
