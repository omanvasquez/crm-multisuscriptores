/**
 * Normalizes phone numbers to Venezuela international format (58XXXXXXXXXX)
 * Removes spaces, hyphens, plus signs and leading 0.
 * Examples:
 *  "0412-4169949" -> "584124169949"
 *  "4141234567"   -> "584141234567"
 *  "+58 412 4169949" -> "584124169949"
 */
export function normalizeVenezuelanPhone(rawPhone) {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).replace(/[^\d]/g, '');
  if (cleaned.startsWith('58')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return `58${cleaned}`;
}

export const PAGO_MOVIL_INFO = {
  banco: 'Banco de Venezuela (0102)',
  bancoCodigo: '0102',
  cedula: '19.888.063',
  telefono: '04124169949',
  titular: 'Oman Vásquez'
};

/**
 * Builds the official WhatsApp reminder link
 */
export function generateWhatsAppLink({ encargado, appSuscrita, nombreNegocio, tarifaUsd, valorBcv, telefono }) {
  const normalizedPhone = normalizeVenezuelanPhone(telefono);
  const montoVes = (Number(tarifaUsd || 0) * Number(valorBcv || 0)).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tasaFormatted = Number(valorBcv || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const message = `Hola ${encargado || 'amigo'}, espero estés bien. Paso por aquí para recordarte la mensualidad de ${appSuscrita || 'tu servicio'} para ${nombreNegocio}. El monto de este ciclo es de ${montoVes} Bs (calculado a la tasa oficial BCV de hoy ${tasaFormatted} Bs/$).

Mis datos de Pago Móvil:
Banco de Venezuela (${PAGO_MOVIL_INFO.bancoCodigo})
C.I.: ${PAGO_MOVIL_INFO.cedula}
Tel: ${PAGO_MOVIL_INFO.telefono}

¡Me avisas cuando realices la transferencia para actualizar tu sistema! 👍🏻`;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
