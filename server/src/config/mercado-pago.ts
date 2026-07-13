export function verificarConfiguracion(): boolean {
  return !!(process.env.MERCADO_PAGO_ACCESS_TOKEN && process.env.MERCADO_PAGO_PUBLIC_KEY);
}
