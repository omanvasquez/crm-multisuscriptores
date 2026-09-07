import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const LOCAL_STORAGE_KEY = 'crm_bcv_rate_data';
const DOLAR_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';

/**
 * Fetches the BCV official exchange rate.
 * Order of preference:
 * 1. DolarAPI (GET https://ve.dolarapi.com/v1/dolares/oficial)
 * 2. Firestore document 'parametros_globales/tdc'
 * 3. LocalStorage cached data
 * 4. Safe default value
 */
export async function getBcvRate() {
  // Try remote API first
  try {
    const res = await fetch(DOLAR_API_URL, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const rate = Number(data.promedio);
      if (rate && !isNaN(rate)) {
        const rateInfo = {
          rate,
          updatedAt: new Date().toISOString(),
          source: 'dolarapi'
        };
        // Cache locally
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rateInfo));
        
        // Sync to firestore in background if authenticated
        try {
          await setDoc(doc(db, 'parametros_globales', 'tdc'), {
            valor_bcv: rate,
            fecha_actualizacion: serverTimestamp(),
            fuente: 'dolarapi'
          }, { merge: true });
        } catch (e) {
          console.warn('Could not sync BCV rate to Firestore:', e.message);
        }

        return rateInfo;
      }
    }
  } catch (err) {
    console.warn('DolarAPI fetch failed, trying Firestore fallback...', err.message);
  }

  // Fallback 1: Firestore doc
  try {
    const snap = await getDoc(doc(db, 'parametros_globales', 'tdc'));
    if (snap.exists()) {
      const data = snap.data();
      if (data.valor_bcv) {
        const rateInfo = {
          rate: Number(data.valor_bcv),
          updatedAt: data.fecha_actualizacion?.toDate?.()?.toISOString() || new Date().toISOString(),
          source: data.fuente || 'firestore'
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rateInfo));
        return rateInfo;
      }
    }
  } catch (err) {
    console.warn('Firestore BCV rate fetch failed:', err.message);
  }

  // Fallback 2: LocalStorage
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error(e);
    }
  }

  // Fallback 3: Default safe rate
  return {
    rate: 45.00,
    updatedAt: new Date().toISOString(),
    source: 'fallback_manual'
  };
}

/**
 * Manually update the BCV rate
 */
export async function saveManualBcvRate(manualRate) {
  const rate = Number(manualRate);
  if (!rate || isNaN(rate) || rate <= 0) {
    throw new Error('Tasa inválida. Debe ser un número mayor a cero.');
  }

  const rateInfo = {
    rate,
    updatedAt: new Date().toISOString(),
    source: 'manual'
  };

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rateInfo));

  try {
    await setDoc(doc(db, 'parametros_globales', 'tdc'), {
      valor_bcv: rate,
      fecha_actualizacion: serverTimestamp(),
      fuente: 'manual'
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save manual rate to Firestore:', err.message);
  }

  return rateInfo;
}
