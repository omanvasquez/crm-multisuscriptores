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

export const DEFAULT_PAGO_MOVIL = {
  banco: 'Banco de Venezuela (0102)',
  bancoCodigo: '0102',
  cedula: '19.888.063',
  telefono: '04124169949',
  titular: 'Oman Vásquez'
};

export const PAGO_MOVIL_INFO = DEFAULT_PAGO_MOVIL;

/**
 * Builds the official WhatsApp reminder link with support for Trial and Prepaid cycles
 */
export function generateWhatsAppLink({ 
  encargado, 
  appSuscrita, 
  nombreNegocio, 
  tarifaUsd, 
  valorBcv, 
  telefono,
  estadoCliente = 'SOLVENTE',
  fechaFinPrueba = null,
  diasRestantesPrueba = null,
  pagoMovilConfig = DEFAULT_PAGO_MOVIL
}) {
  const pm = { ...DEFAULT_PAGO_MOVIL, ...(pagoMovilConfig || {}) };
  const normalizedPhone = normalizeVenezuelanPhone(telefono);
  const montoVes = (Number(tarifaUsd || 0) * Number(valorBcv || 0)).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tasaFormatted = Number(valorBcv || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const app = appSuscrita || 'tu servicio';
  const contacto = encargado || 'amigo';

  let intro = '';
  if (estadoCliente === 'SUSPENDIDO') {
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(`Hola ${contacto}, espero estés bien. Te contacto de ${app} para ${nombreNegocio}.

Queríamos consultarte cómo te fue con el sistema y si te gustaría reactivar tu acceso. Tenemos planes y promociones especiales disponibles para tu comercio si deseas volver a utilizar la plataforma.

¡Quedo a tu total orden si deseas reactivarlo! 👍🏻`)}`;
  } else if (estadoCliente === 'EN_PRUEBA') {
    const tiempoTexto = diasRestantesPrueba !== null 
      ? (diasRestantesPrueba <= 0 ? 'finaliza hoy' : `finaliza en ${diasRestantesPrueba} día${diasRestantesPrueba > 1 ? 's' : ''}${fechaFinPrueba ? ` (${fechaFinPrueba})` : ''}`)
      : (fechaFinPrueba ? `finaliza el ${fechaFinPrueba}` : 'está por finalizar');
    intro = `Hola ${contacto}, espero estés bien. Te escribo para comentarte que tu período de prueba gratuito de ${app} para ${nombreNegocio} ${tiempoTexto}.\n\nPara continuar disfrutando del servicio sin interrupciones, el monto de tu primer mes por adelantado es de ${montoVes} Bs (calculado a la tasa oficial BCV de hoy ${tasaFormatted} Bs/$).`;
  } else if (estadoCliente === 'PRUEBA_VENCIDA') {
    intro = `Hola ${contacto}, espero estés bien. Tu período de prueba gratuito de ${app} para ${nombreNegocio} ya ha finalizado.\n\nPara reactivar y continuar utilizando el sistema sin interrupciones, el monto del primer mes por adelantado es de ${montoVes} Bs (calculado a la tasa oficial BCV de hoy ${tasaFormatted} Bs/$).`;
  } else if (estadoCliente === 'POR_VENCER') {
    intro = `Hola ${contacto}, espero te encuentres excelente. Te contacto con un saludo cordial de ${app} para recordarte de forma preventiva que tu mensualidad de ${nombreNegocio} vencerá en los próximos días. El monto para renovar el ciclo adelantado es de ${montoVes} Bs (tasa oficial BCV de hoy ${tasaFormatted} Bs/$).`;
  } else {
    // Normal recurring prepaid renewal
    intro = `Hola ${contacto}, espero estés bien. Paso por aquí para recordarte la renovación mensual adelantada de ${app} para ${nombreNegocio}. El monto de este ciclo es de ${montoVes} Bs (calculado a la tasa oficial BCV de hoy ${tasaFormatted} Bs/$).`;
  }

  const message = `${intro}

Mis datos de Pago Móvil:
${pm.banco}
C.I.: ${pm.cedula}
Tel: ${pm.telefono}
Titular: ${pm.titular || 'Oman Vásquez'}

¡Me avisas cuando realices la transferencia para actualizar tu sistema! 👍🏻`;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a formal Digital Receipt message for WhatsApp
 */
export function generateReceiptText({
  transactionId,
  nombreNegocio,
  appSuscrita,
  idExterno,
  montoUsd,
  tasaBcv,
  montoVes,
  metodoPago,
  fechaPago,
  validoHasta,
  mesesPagados = 1,
  referencia = '',
  nota = ''
}) {
  const folio = transactionId ? transactionId.slice(-6).toUpperCase() : 'REC-' + Date.now().toString().slice(-4);
  const tasaFmt = Number(tasaBcv || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const vesFmt = Number(montoVes || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const usdFmt = Number(montoUsd || 0).toFixed(2);
  const fechaFmt = fechaPago || new Date().toLocaleDateString('es-VE');

  return `🧾 *COMPROBANTE DE COBRANZA*
*Folio:* #${folio}
━━━━━━━━━━━━━━━━━━━━━━━
🏢 *Comercio:* ${nombreNegocio || 'Cliente'}
💻 *Software:* ${appSuscrita || 'General'}
${idExterno ? `🆔 *ID App:* ${idExterno}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━
💵 *Monto:* $${usdFmt} USD (${mesesPagados} mes${mesesPagados > 1 ? 'es' : ''})
📈 *Tasa BCV:* ${tasaFmt} Bs/$
🇻🇪 *Total Percibido:* ${vesFmt} Bs
💳 *Método:* ${metodoPago || 'Pago Móvil'}
${referencia ? `🔢 *Referencia:* ${referencia}\n` : ''}📅 *Fecha de Pago:* ${fechaFmt}
🗓️ *Válido hasta:* ${validoHasta || 'Próximo corte'}
${nota ? `📝 *Nota:* ${nota}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━
✅ *Estado del Servicio:* Solvente y Activo

¡Muchas gracias por tu pago puntual! 👍🏻`;
}

/**
 * Generates direct WhatsApp URL with the digital receipt
 */
export function generateReceiptWhatsAppLink(phone, receiptData) {
  const normalizedPhone = normalizeVenezuelanPhone(phone);
  const text = generateReceiptText(receiptData);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}
