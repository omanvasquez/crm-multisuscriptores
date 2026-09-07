import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
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

/**
 * Subscribes to all active clients in real time
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
      
      // Calculate solvency dynamically based on next due date
      let isSolvent = data.estado_pago ?? true;
      if (data.fecha_proximo_pago) {
        const dueDate = data.fecha_proximo_pago.toDate ? data.fecha_proximo_pago.toDate() : new Date(data.fecha_proximo_pago);
        // If due date has passed the current day (at midnight), consider delinquent
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        if (dueMidnight < todayMidnight) {
          isSolvent = false;
        }
      }

      return {
        id: d.id,
        ...data,
        estado_pago: isSolvent
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
 * Creates a new client
 */
export async function createClient(data) {
  const normalizedPhone = normalizeVenezuelanPhone(data.telefono);
  
  // Date parsing
  const startDate = data.fecha_inicio_contrato ? new Date(data.fecha_inicio_contrato) : new Date();
  const nextPaymentDate = data.fecha_proximo_pago ? new Date(data.fecha_proximo_pago) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const newClient = {
    nombre_negocio: data.nombre_negocio?.trim() || '',
    app_suscrita: data.app_suscrita?.trim() || 'General',
    encargado: data.encargado?.trim() || '',
    cedula: data.cedula?.trim() || '',
    telefono: normalizedPhone,
    direccion: data.direccion?.trim() || '',
    estado_region: data.estado_region?.trim() || 'Cojedes',
    tarifa_base_usd: Number(data.tarifa_base_usd) || 0,
    fecha_inicio_contrato: Timestamp.fromDate(startDate),
    fecha_proximo_pago: Timestamp.fromDate(nextPaymentDate),
    fecha_ultimo_pago: null,
    estado_pago: true,
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
    nombre_negocio: data.nombre_negocio?.trim() || '',
    app_suscrita: data.app_suscrita?.trim() || 'General',
    encargado: data.encargado?.trim() || '',
    cedula: data.cedula?.trim() || '',
    telefono: normalizeVenezuelanPhone(data.telefono),
    direccion: data.direccion?.trim() || '',
    estado_region: data.estado_region?.trim() || '',
    tarifa_base_usd: Number(data.tarifa_base_usd) || 0,
    actualizado_el: serverTimestamp()
  };

  if (data.fecha_inicio_contrato) {
    updateData.fecha_inicio_contrato = Timestamp.fromDate(new Date(data.fecha_inicio_contrato));
  }
  if (data.fecha_proximo_pago) {
    updateData.fecha_proximo_pago = Timestamp.fromDate(new Date(data.fecha_proximo_pago));
  }

  return await updateDoc(clientRef, updateData);
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
 * Records a payment in 'transacciones' and advances next payment date by 1 month
 */
export async function registerClientPayment({
  clientId,
  clientName,
  montoUsd,
  valorBcv,
  metodoPago = 'Pago Móvil',
  currentDueDate
}) {
  const montoUsdNum = Number(montoUsd);
  const valorBcvNum = Number(valorBcv);
  const montoVes = Number((montoUsdNum * valorBcvNum).toFixed(2));

  // 1. Create transaction doc
  const transactionData = {
    id_cliente: clientId,
    nombre_negocio: clientName,
    fecha_pago: serverTimestamp(),
    monto_usd_base: montoUsdNum,
    tasa_bcv_aplicada: valorBcvNum,
    monto_ves_cobrado: montoVes,
    metodo_pago: metodoPago
  };

  const transactionRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), transactionData);

  // 2. Calculate next payment date (+1 month from current due date or from today)
  let baseDate = currentDueDate ? (currentDueDate.toDate ? currentDueDate.toDate() : new Date(currentDueDate)) : new Date();
  const now = new Date();
  
  // If current due date was already in the past, add 30 days from today
  if (baseDate < now) {
    baseDate = new Date();
  }
  
  // Add 1 month (safely handle month boundaries)
  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + 1);

  // 3. Update client record
  const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
  await updateDoc(clientRef, {
    fecha_ultimo_pago: Timestamp.now(),
    fecha_proximo_pago: Timestamp.fromDate(nextDate),
    estado_pago: true,
    actualizado_el: serverTimestamp()
  });

  return transactionRef;
}

/**
 * Subscribes to recent transactions
 */
export function subscribeToTransactions(onSuccess, onError, maxItems = 50) {
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
