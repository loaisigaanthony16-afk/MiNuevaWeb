// Ruta anterior del IPN: las facturas creadas antes del cambio siguen
// avisando acá. Mismo manejador, misma validación de firma.
export { POST } from "@/app/api/webhooks/nowpayments/route";
