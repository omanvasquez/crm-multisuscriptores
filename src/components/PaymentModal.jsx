import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, Calendar, CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, onConfirm, client, bcvRate }) {
  const [metodoPago, setMetodoPago] = useState('Pago Móvil');
  const [customUsd, setCustomUsd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !client) return null;

  const montoUsd = customUsd !== '' ? Number(customUsd) : Number(client.tarifa_base_usd || 0);
  const tasaBcv = Number(bcvRate || 0);
  const montoVes = montoUsd * tasaBcv;

  // Next calculated date: +1 month
  const currentDueDate = client.fecha_proximo_pago?.toDate 
    ? client.fecha_proximo_pago.toDate() 
    : new Date(client.fecha_proximo_pago?.seconds ? client.fecha_proximo_pago.seconds * 1000 : client.fecha_proximo_pago || Date.now());
  
  const now = new Date();
  const baseDate = currentDueDate < now ? now : currentDueDate;
  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + 1);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({
        clientId: client.id,
        clientName: client.nombre_negocio,
        montoUsd,
        valorBcv: tasaBcv,
        metodoPago,
        currentDueDate: client.fecha_proximo_pago
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Error registrando el pago: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {client.en_periodo_prueba || client.estado_cliente === 'PRUEBA_VENCIDA' ? 'Cobro 1er Mes (Post-Prueba)' : 'Registrar Cobranza Adelantada'}
            </h2>
            <p className="text-xs text-slate-400">
              {client.nombre_negocio} ({client.app_suscrita || 'General'})
              {client.id_externo ? ` • ID: ${client.id_externo}` : ''}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Calculation Details Card */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tarifa acordada:</span>
            <span className="font-semibold text-slate-200">${client.tarifa_base_usd?.toFixed(2)} USD</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tasa oficial BCV aplicada:</span>
            <span className="font-semibold text-emerald-400">
              {tasaBcv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/$
            </span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Total Cobrado en Bs:</span>
            <span className="text-xl font-black text-emerald-400 tracking-tight">
              {montoVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
            </span>
          </div>

        </div>

        {/* Payment Method Selector */}
        <div className="mt-5 space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Método de Pago Utilizado:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['Pago Móvil', 'Efectivo USD', 'Efectivo VES', 'Transferencia'].map((metodo) => (
              <button
                key={metodo}
                type="button"
                onClick={() => setMetodoPago(metodo)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all text-center ${
                  metodoPago === metodo
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {metodo}
              </button>
            ))}
          </div>
        </div>

        {/* Cycle Advance Preview */}
        <div className="mt-5 p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {client.en_periodo_prueba || client.estado_cliente === 'PRUEBA_VENCIDA' ? 'Activa servicio hasta:' : 'Renueva servicio hasta:'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            {currentDueDate && (
              <span className="text-slate-500 line-through">
                {currentDueDate.toLocaleDateString('es-VE')}
              </span>
            )}
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">
              {nextDate.toLocaleDateString('es-VE')} (+1 mes adelantado)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
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
