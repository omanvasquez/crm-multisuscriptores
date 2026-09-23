import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  CreditCard, 
  ArrowRight, 
  Calendar, 
  MessageCircle, 
  Copy, 
  Check
} from 'lucide-react';
import { generateReceiptWhatsAppLink, generateReceiptText } from '../utils/phone';
import { triggerHaptic } from '../utils/haptics';

export default function PaymentModal({ isOpen, onClose, onConfirm, client, bcvRate, paymentConfig }) {
  const [metodoPago, setMetodoPago] = useState('Pago Móvil');
  const [meses, setMeses] = useState(1);
  const [customUsd, setCustomUsd] = useState('');
  const [referencia, setReferencia] = useState('');
  const [nota, setNota] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Completed receipt view state
  const [completedPayment, setCompletedPayment] = useState(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  if (!isOpen || !client) return null;

  const tarifaBase = Number(client.tarifa_base_usd || 0);
  const montoUsd = customUsd !== '' ? Number(customUsd) : (tarifaBase * meses);
  const tasaBcv = Number(bcvRate || 0);
  const montoVes = montoUsd * tasaBcv;

  // Next calculated date: +meses
  const currentDueDate = client.fecha_proximo_pago?.toDate 
    ? client.fecha_proximo_pago.toDate() 
    : new Date(client.fecha_proximo_pago?.seconds ? client.fecha_proximo_pago.seconds * 1000 : client.fecha_proximo_pago || Date.now());
  
  const now = new Date();
  const baseDate = currentDueDate < now ? now : currentDueDate;
  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + meses);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await onConfirm({
        clientId: client.id,
        clientName: client.nombre_negocio,
        montoUsd,
        valorBcv: tasaBcv,
        metodoPago,
        currentDueDate: client.fecha_proximo_pago,
        mesesAdelantados: meses,
        referencia,
        nota
      });

      triggerHaptic('heavy');
      setCompletedPayment({
        transactionId: result?.id || '',
        nombreNegocio: client.nombre_negocio,
        appSuscrita: client.app_suscrita,
        idExterno: client.id_externo,
        montoUsd,
        tasaBcv,
        montoVes,
        metodoPago,
        fechaPago: new Date().toLocaleDateString('es-VE'),
        validoHasta: nextDate.toLocaleDateString('es-VE'),
        mesesPagados: meses,
        referencia,
        nota
      });
    } catch (err) {
      console.error(err);
      setError('Error registrando el pago: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyReceipt = () => {
    if (!completedPayment) return;
    const text = generateReceiptText(completedPayment);
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    triggerHaptic('light');
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const handleCloseAll = () => {
    setCompletedPayment(null);
    setCustomUsd('');
    setMeses(1);
    setReferencia('');
    setNota('');
    setError(null);
    onClose();
  };

  // SUCCESS SCREEN (RECIBO DIGITAL)
  if (completedPayment) {
    const whatsappUrl = generateReceiptWhatsAppLink(client.telefono, completedPayment);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative transition-colors duration-150">
          
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            ¡Cobranza Registrada!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Se renovó la suscripción de <strong className="text-slate-800 dark:text-slate-200">{client.nombre_negocio}</strong> hasta el <strong className="text-emerald-600 dark:text-emerald-400">{completedPayment.validoHasta}</strong>.
          </p>

          {/* Receipt Preview Box */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-left text-xs font-mono space-y-1 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800/80 pb-1.5 mb-2">
              <span>RECIBO #{completedPayment.transactionId.slice(-6).toUpperCase()}</span>
              <span className="text-emerald-600 dark:text-emerald-400">PAGADO</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Monto USD:</span>
              <span>${completedPayment.montoUsd.toFixed(2)} ({completedPayment.mesesPagados} mes{completedPayment.mesesPagados > 1 ? 'es' : ''})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tasa BCV:</span>
              <span>{completedPayment.tasaBcv.toFixed(2)} Bs/$</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-1">
              <span>Total en Bs:</span>
              <span>{completedPayment.montoVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>Método:</span>
              <span>{completedPayment.metodoPago}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar Recibo por WhatsApp</span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyReceipt}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                {copiedReceipt ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCloseAll}
                className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
              >
                Finalizar
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // REGULAR PAYMENT FORM
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto transition-colors duration-150">
        
        {/* Close Button */}
        <button
          onClick={handleCloseAll}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {client.en_periodo_prueba || client.estado_cliente === 'PRUEBA_VENCIDA' ? 'Cobro 1er Mes (Post-Prueba)' : 'Registrar Cobranza Adelantada'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {client.nombre_negocio} ({client.app_suscrita || 'General'})
              {client.id_externo ? ` • ID: ${client.id_externo}` : ''}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Multi-Month Selector */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Periodo a Cobrar:</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
              Tarifa: ${tarifaBase.toFixed(2)} USD/mes
            </span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 6].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMeses(m);
                  setCustomUsd('');
                  triggerHaptic('light');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
                  meses === m && customUsd === ''
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {m} {m === 1 ? 'Mes' : 'Meses'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
            <button
              type="button"
              onClick={() => {
                setMeses(12);
                setCustomUsd('');
                triggerHaptic('light');
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-all text-center ${
                meses === 12 && customUsd === ''
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              1 Año Completo (12 meses)
            </button>
            
            {/* Monto personalizado */}
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="Monto $ personalizado"
                value={customUsd}
                onChange={(e) => setCustomUsd(e.target.value)}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Calculation Details Card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
          
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Monto total USD:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              ${montoUsd.toFixed(2)} USD {meses > 1 ? `(${meses} meses)` : ''}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tasa oficial BCV aplicada:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {tasaBcv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/$
            </span>
          </div>

          <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Total Cobrado en Bs:</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {montoVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
            </span>
          </div>

        </div>

        {/* Payment Method Selector */}
        <div className="mt-4 space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Método de Pago Utilizado:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['Pago Móvil', 'Efectivo USD', 'Efectivo VES', 'Transferencia'].map((metodo) => (
              <button
                key={metodo}
                type="button"
                onClick={() => { setMetodoPago(metodo); triggerHaptic('light'); }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all text-center ${
                  metodoPago === metodo
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {metodo}
              </button>
            ))}
          </div>
        </div>

        {/* Referencia y Notas */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Referencia Bancaria (Opcional)
            </label>
            <input
              type="text"
              placeholder="ej. 491028"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Nota / Detalle (Opcional)
            </label>
            <input
              type="text"
              placeholder="ej. Pagó encargado"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Cycle Advance Preview */}
        <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Renueva servicio hasta:</span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            {currentDueDate && (
              <span className="text-slate-400 dark:text-slate-500 line-through">
                {currentDueDate.toLocaleDateString('es-VE')}
              </span>
            )}
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-600 dark:text-emerald-400">
              {nextDate.toLocaleDateString('es-VE')} (+{meses} mes{meses > 1 ? 'es' : ''})
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCloseAll}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Registrando...' : 'Confirmar Cobro'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
