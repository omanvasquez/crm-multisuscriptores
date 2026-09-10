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
  diasRestantesPrueba = null
}) {
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
  } else {
    // Normal recurring prepaid renewal
    intro = `Hola ${contacto}, espero estés bien. Paso por aquí para recordarte la renovación mensual adelantada de ${app} para ${nombreNegocio}. El monto de este ciclo es de ${montoVes} Bs (calculado a la tasa oficial BCV de hoy ${tasaFormatted} Bs/$).`;
  }

  const message = `${intro}

Mis datos de Pago Móvil:
Banco de Venezuela (${PAGO_MOVIL_INFO.bancoCodigo})
C.I.: ${PAGO_MOVIL_INFO.cedula}
Tel: ${PAGO_MOVIL_INFO.telefono}

¡Me avisas cuando realices la transferencia para actualizar tu sistema! 👍🏻`;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
