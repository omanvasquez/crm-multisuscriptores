import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  getDoc,
  doc, 
  serverTimestamp, 
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { normalizeVenezuelanPhone } from '../utils/phone';

const CLIENTS_COLLECTION = 'clientes';
const TRANSACTIONS_COLLECTION = 'transacciones';
const CONFIG_COLLECTION = 'configuracion';
const PAGOS_DOC = 'pagos';

/**
 * Subscribes to all active clients in real time and calculates dynamic statuses
 */
export function subscribeToClients(onSuccess, onError) {
  const q = query(
    collection(db, CLIENTS_COLLECTION),
    where('activo', '==', true)
  );

  return onSnapshot(q, (snapshot) => {
    const clients = snapshot.docs.map(d => {
      const data = d.data();
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let estado_cliente = 'SOLVENTE'; // 'EN_PRUEBA' | 'PRUEBA_VENCIDA' | 'POR_VENCER' | 'SOLVENTE' | 'MOROSO' | 'SUSPENDIDO'
      let isSolvent = true;
      let dias_restantes_prueba = null;
      let dias_diferencia = 0;

      const isSuspended = Boolean(data.suspendido);
      const isTrial = Boolean(data.en_periodo_prueba);

      if (isSuspended) {
        estado_cliente = 'SUSPENDIDO';
        isSolvent = false;
      } else if (isTrial && data.fecha_fin_prueba) {
        const trialEndDate = data.fecha_fin_prueba.toDate 
          ? data.fecha_fin_prueba.toDate() 
          : new Date(data.fecha_fin_prueba.seconds ? data.fecha_fin_prueba.seconds * 1000 : data.fecha_fin_prueba);
        const trialEndMidnight = new Date(trialEndDate.getFullYear(), trialEndDate.getMonth(), trialEndDate.getDate());
        
        const diffTime = trialEndMidnight - todayMidnight;
        dias_restantes_prueba = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dias_restantes_prueba >= 0) {
          estado_cliente = 'EN_PRUEBA';
          isSolvent = true;
        } else {
          // Trial has expired
          if (!data.fecha_ultimo_pago) {
            estado_cliente = 'PRUEBA_VENCIDA';
            isSolvent = false;
          } else {
            // Already made a payment, check regular cut-off
            checkRegularPayment();
          }
        }
      } else {
        checkRegularPayment();
      }

      function checkRegularPayment() {
        if (data.fecha_proximo_pago) {
          const dueDate = data.fecha_proximo_pago.toDate 
            ? data.fecha_proximo_pago.toDate() 
            : new Date(data.fecha_proximo_pago.seconds ? data.fecha_proximo_pago.seconds * 1000 : data.fecha_proximo_pago);
          const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
          const diffTime = dueMidnight - todayMidnight;
          dias_diferencia = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (dueMidnight < todayMidnight) {
            isSolvent = false;
            estado_cliente = 'MOROSO';
          } else if (dias_diferencia >= 0 && dias_diferencia <= 4) {
            isSolvent = true;
            estado_cliente = 'POR_VENCER';
          } else {
            isSolvent = true;
            estado_cliente = 'SOLVENTE';
          }
        } else {
          isSolvent = data.estado_pago ?? true;
          estado_cliente = isSolvent ? 'SOLVENTE' : 'MOROSO';
        }
      }

      return {
        id: d.id,
        ...data,
        id_externo: data.id_externo || '',
        suspendido: isSuspended,
        estado_pago: isSolvent,
        estado_cliente,
        dias_restantes_prueba,
        dias_diferencia
      };
    });

    // Sort by due date (closest first)
    clients.sort((a, b) => {
      const timeA = a.fecha_proximo_pago?.seconds ? a.fecha_proximo_pago.seconds : 0;
      const timeB = b.fecha_proximo_pago?.seconds ? b.fecha_proximo_pago.seconds : 0;
      return timeA - timeB;
    });

    onSuccess(clients);
  }, onError);
}

/**
 * Creates a new client with prepaid and trial logic
 */
export async function createClient(data) {
  const normalizedPhone = normalizeVenezuelanPhone(data.telefono);
  const startDate = data.fecha_inicio_contrato ? new Date(data.fecha_inicio_contrato) : new Date();

  const isTrial = Boolean(data.en_periodo_prueba);
  let trialEndDate = null;
  let nextPaymentDate = null;
  let lastPaymentDate = null;
  let isSolvent = true;

  if (isTrial) {
    const days = Number(data.dias_prueba) || 14;
    trialEndDate = data.fecha_fin_prueba 
      ? new Date(data.fecha_fin_prueba) 
      : new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    nextPaymentDate = trialEndDate;
    isSolvent = true;
  } else {
    if (data.primer_pago_inmediato) {
      lastPaymentDate = Timestamp.fromDate(startDate);
      const nextDate = new Date(startDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextPaymentDate = nextDate;
      isSolvent = true;
    } else {
      nextPaymentDate = data.fecha_proximo_pago ? new Date(data.fecha_proximo_pago) : startDate;
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const nextMidnight = new Date(nextPaymentDate.getFullYear(), nextPaymentDate.getMonth(), nextPaymentDate.getDate());
      isSolvent = nextMidnight >= todayMidnight;
    }
  }

  const newClient = {
    id_externo: data.id_externo?.trim() || '',
    nombre_negocio: data.nombre_negocio?.trim() || '',
    app_suscrita: data.app_suscrita?.trim() || 'General',
    encargado: data.encargado?.trim() || '',
    cedula: data.cedula?.trim() || '',
    telefono: normalizedPhone,
    direccion: data.direccion?.trim() || '',
    estado_region: data.estado_region?.trim() || 'Cojedes',
    tarifa_base_usd: Number(data.tarifa_base_usd) || 0,
    en_periodo_prueba: isTrial,
    dias_prueba: isTrial ? (Number(data.dias_prueba) || 14) : 0,
    fecha_fin_prueba: trialEndDate ? Timestamp.fromDate(trialEndDate) : null,
    fecha_inicio_contrato: Timestamp.fromDate(startDate),
    fecha_proximo_pago: Timestamp.fromDate(nextPaymentDate),
    fecha_ultimo_pago: lastPaymentDate,
    estado_pago: isSolvent,
    suspendido: Boolean(data.suspendido) || false,
    activo: true,
    creado_el: serverTimestamp()
  };

  return await addDoc(collection(db, CLIENTS_COLLECTION), newClient);
}

/**
 * Updates an existing client
 */
export async function updateClient(clientId, data) {
  const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
  
  const updateData = {
    id_externo: data.id_externo?.trim() || '',
    nombre_negocio: data.nombre_negocio?.trim() || '',
    app_suscrita: data.app_suscrita?.trim() || 'General',
    encargado: data.encargado?.trim() || '',
    cedula: data.cedula?.trim() || '',
    telefono: normalizeVenezuelanPhone(data.telefono),
    direccion: data.direccion?.trim() || '',
    estado_region: data.estado_region?.trim() || '',
    tarifa_base_usd: Number(data.tarifa_base_usd) || 0,
    en_periodo_prueba: Boolean(data.en_periodo_prueba),
    dias_prueba: Number(data.dias_prueba) || 0,
    actualizado_el: serverTimestamp()
  };

  if (data.suspendido !== undefined) {
    updateData.suspendido = Boolean(data.suspendido);
  }

  if (data.fecha_fin_prueba) {
    updateData.fecha_fin_prueba = Timestamp.fromDate(new Date(data.fecha_fin_prueba));
  } else if (!data.en_periodo_prueba) {
    updateData.fecha_fin_prueba = null;
  }

  if (data.fecha_inicio_contrato) {
    updateData.fecha_inicio_contrato = Timestamp.fromDate(new Date(data.fecha_inicio_contrato));
  }
  if (data.fecha_proximo_pago) {
    updateData.fecha_proximo_pago = Timestamp.fromDate(new Date(data.fecha_proximo_pago));
  }

  return await updateDoc(clientRef, updateData);
}

/**
 * Toggles a client's suspended service state
 */
export async function toggleSuspendClient(clientId, suspendido) {
  const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
  return await updateDoc(clientRef, {
    suspendido: Boolean(suspendido),
    actualizado_el: serverTimestamp()
  });
}

/**
 * Soft delete: Marks client as inactive without deleting document
 */
export async function softDeleteClient(clientId) {
  const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
  return await updateDoc(clientRef, {
    activo: false,
    eliminado_el: serverTimestamp()
  });
}

/**
 * Records a payment in 'transacciones' and advances next payment date by X months (multi-month support)
 */
export async function registerClientPayment({
  clientId,
  clientName,
  montoUsd,
  valorBcv,
  metodoPago = 'Pago Móvil',
  currentDueDate,
  mesesAdelantados = 1,
  referencia = '',
  nota = ''
}) {
  const montoUsdNum = Number(montoUsd);
  const valorBcvNum = Number(valorBcv);
  const montoVes = Number((montoUsdNum * valorBcvNum).toFixed(2));
  const meses = Number(mesesAdelantados) || 1;

  // 1. Create transaction doc
  const transactionData = {
    id_cliente: clientId,
    nombre_negocio: clientName,
    fecha_pago: serverTimestamp(),
    monto_usd_base: montoUsdNum,
    tasa_bcv_aplicada: valorBcvNum,
    monto_ves_cobrado: montoVes,
    metodo_pago: metodoPago,
    meses_pagados: meses,
    referencia: referencia?.trim() || '',
    nota: nota?.trim() || ''
  };

  const transactionRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), transactionData);

  // 2. Calculate next payment date (+X months from current due date or from today)
  let baseDate = currentDueDate ? (currentDueDate.toDate ? currentDueDate.toDate() : new Date(currentDueDate)) : new Date();
  const now = new Date();
  
  if (baseDate < now) {
    baseDate = new Date();
  }
  
  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + meses);

  // 3. Update client record (completes trial if in trial, reactivates if suspended)
  const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
  await updateDoc(clientRef, {
    fecha_ultimo_pago: Timestamp.now(),
    fecha_proximo_pago: Timestamp.fromDate(nextDate),
    estado_pago: true,
    en_periodo_prueba: false,
    suspendido: false,
    actualizado_el: serverTimestamp()
  });

  return {
    id: transactionRef.id,
    ...transactionData,
    calculatedNextDate: nextDate
  };
}

/**
 * Updates an existing transaction (Edición de cobro)
 */
export async function updateTransaction(transactionId, updateData) {
  const txRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
  const data = {
    nombre_negocio: updateData.nombre_negocio?.trim() || '',
    monto_usd_base: Number(updateData.monto_usd_base) || 0,
    tasa_bcv_aplicada: Number(updateData.tasa_bcv_aplicada) || 0,
    monto_ves_cobrado: Number(updateData.monto_ves_cobrado) || 0,
    metodo_pago: updateData.metodo_pago || 'Pago Móvil',
    meses_pagados: Number(updateData.meses_pagados) || 1,
    referencia: updateData.referencia?.trim() || '',
    nota: updateData.nota?.trim() || '',
    actualizado_el: serverTimestamp()
  };

  if (updateData.fecha_pago) {
    data.fecha_pago = updateData.fecha_pago instanceof Timestamp 
      ? updateData.fecha_pago 
      : Timestamp.fromDate(new Date(updateData.fecha_pago));
  }

  return await updateDoc(txRef, data);
}

/**
 * Deletes a transaction and optionally adjusts client's due date (Borrado de cobro)
 */
export async function deleteTransaction(transactionId, clientId = null, adjustDate = null) {
  const txRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
  await deleteDoc(txRef);

  if (clientId && adjustDate) {
    const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
    await updateDoc(clientRef, {
      fecha_proximo_pago: Timestamp.fromDate(new Date(adjustDate)),
      actualizado_el: serverTimestamp()
    });
  }
}

/**
 * Subscribes to recent transactions
 */
export function subscribeToTransactions(onSuccess, onError, maxItems = 100) {
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    orderBy('fecha_pago', 'desc'),
    limit(maxItems)
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    onSuccess(transactions);
  }, onError);
}

/**
 * Subscribes to payment configuration in Firestore (banco, cedula, telefono)
 */
export function subscribeToPaymentConfig(onSuccess, onError) {
  const docRef = doc(db, CONFIG_COLLECTION, PAGOS_DOC);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      onSuccess(snap.data());
    } else {
      onSuccess(null);
    }
  }, onError);
}

/**
 * Saves or updates payment configuration in Firestore
 */
export async function savePaymentConfig(configData) {
  const docRef = doc(db, CONFIG_COLLECTION, PAGOS_DOC);
  return await setDoc(docRef, {
    ...configData,
    actualizado_el: serverTimestamp()
  }, { merge: true });
}
