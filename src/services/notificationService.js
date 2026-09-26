/**
 * Servicio de Notificaciones Web / PWA para CRM Multi-Suscripciones
 * Permite emitir alertas al dispositivo del administrador cuando
 * hay suscripciones que cumplen fecha de cobro el día de hoy.
 */

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error al solicitar permiso de notificaciones:', err);
    return 'denied';
  }
}

/**
 * Muestra una notificación en el dispositivo usando el Service Worker (recomendado para PWA/Android)
 * o con fallback a Notification estándar de ventana.
 */
export async function showSystemNotification(title, options = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions = {
    icon: '/icon-192.png',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    ...options
  };

  // 1. Intentar a través de Service Worker Registration (necesario para Chrome en Android / PWA)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, defaultOptions);
        return true;
      }
    } catch (err) {
      console.warn('Fallo SW showNotification, intentando fallback de ventana:', err);
    }
  }

  // 2. Fallback estándar de ventana (Desktop)
  try {
    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.error('Fallo al emitir Notification:', err);
    return false;
  }
}

/**
 * Filtra los clientes que vencen hoy
 */
export function getClientsDueToday(clients) {
  if (!Array.isArray(clients)) return [];
  return clients.filter(c => {
    if (c.suspendido) return false;
    // Si está en prueba y vence hoy
    if (c.en_periodo_prueba && c.dias_restantes_prueba === 0) return true;
    // Si no está en prueba y su corte es hoy
    if (!c.en_periodo_prueba && c.dias_diferencia === 0) return true;
    return false;
  });
}

/**
 * Envía la notificación agrupada de cobros del día
 */
export async function sendDueTodayNotification(clients, bcvRate, isManualTest = false) {
  if (!isNotificationSupported()) {
    if (isManualTest) alert('Las notificaciones no están soportadas en este navegador.');
    return false;
  }

  if (Notification.permission !== 'granted') {
    if (isManualTest) {
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') {
        alert('Se requiere otorgar permisos de notificación en el navegador.');
        return false;
      }
    } else {
      return false;
    }
  }

  const dueToday = getClientsDueToday(clients);

  if (dueToday.length === 0) {
    if (isManualTest) {
      return await showSystemNotification('✅ CRM: Todo al día', {
        body: 'No hay comercios con fecha de cobro para hoy. ¡Todo al día!',
        tag: 'crm-status-check'
      });
    }
    return false;
  }

  if (dueToday.length === 1) {
    const c = dueToday[0];
    const rateNum = Number(bcvRate) || 0;
    const montoBs = rateNum > 0 
      ? ` (~${Math.round(c.tarifa_base_usd * rateNum).toLocaleString('es-VE')} Bs)` 
      : '';

    return await showSystemNotification(`🔔 Cobro de Hoy: ${c.nombre_negocio}`, {
      body: `${c.app_suscrita || 'ComercioPro'} • Tarifa: $${c.tarifa_base_usd}${montoBs}. Toca para abrir y cobrar por WhatsApp.`,
      tag: 'crm-cobros-hoy',
      data: { statusFilter: 'TODAY' }
    });
  }

  // Si son múltiples clientes (ideal para 10, 50, 100+ clientes al día)
  const totalUsd = dueToday.reduce((sum, c) => sum + (Number(c.tarifa_base_usd) || 0), 0);
  const rateNum = Number(bcvRate) || 0;
  const montoBs = rateNum > 0 
    ? ` (~${Math.round(totalUsd * rateNum).toLocaleString('es-VE')} Bs)` 
    : '';

  const sampleNames = dueToday.slice(0, 3).map(c => c.nombre_negocio).join(', ');
  const extraCount = dueToday.length > 3 ? ` y ${dueToday.length - 3} más` : '';

  return await showSystemNotification(`🔔 ${dueToday.length} cobros para hoy ($${totalUsd} USD${montoBs})`, {
    body: `${sampleNames}${extraCount}. Toca para filtrar la lista y cobrar.`,
    tag: 'crm-cobros-hoy',
    data: { statusFilter: 'TODAY' }
  });
}

/**
 * Verificación automática diaria:
 * Se ejecuta al iniciar sesión o cargar la app. Si hoy no se ha notificado
 * y hay clientes por cobrar, envía la alerta una vez por día.
 */
export async function checkDailyDueCobros(clients, bcvRate) {
  if (getNotificationPermission() !== 'granted') return;

  const dueToday = getClientsDueToday(clients);
  if (dueToday.length === 0) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const lastNotifDate = localStorage.getItem('crm_last_notif_date');
  const lastNotifCount = localStorage.getItem('crm_last_notif_count');

  // Solo notificar si es un día nuevo o si la cantidad de clientes de hoy aumentó
  if (lastNotifDate !== todayStr || lastNotifCount !== dueToday.length.toString()) {
    await sendDueTodayNotification(clients, bcvRate, false);
    localStorage.setItem('crm_last_notif_date', todayStr);
    localStorage.setItem('crm_last_notif_count', dueToday.length.toString());
  }
}
