import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, CheckCircle2, AlertTriangle, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export default function TransactionEditModal({ 
  isOpen, 
  onClose, 
  transaction, 
  onSave, 
  onDelete 
}) {
  const [formData, setFormData] = useState({
    nombre_negocio: '',
    monto_usd_base: '',
    tasa_bcv_aplicada: '',
    monto_ves_cobrado: '',
    metodo_pago: 'Pago Móvil',
    meses_pagados: 1,
    referencia: '',
    nota: '',
    fecha_pago: ''
  });

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (transaction) {
      const date = transaction.fecha_pago?.toDate 
        ? transaction.fecha_pago.toDate() 
        : new Date(transaction.fecha_pago?.seconds ? transaction.fecha_pago.seconds * 1000 : transaction.fecha_pago || Date.now());
      
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}T${hh}:${min}`;

      setFormData({
        nombre_negocio: transaction.nombre_negocio || '',
        monto_usd_base: transaction.monto_usd_base ?? '',
        tasa_bcv_aplicada: transaction.tasa_bcv_aplicada ?? '',
        monto_ves_cobrado: transaction.monto_ves_cobrado ?? '',
        metodo_pago: transaction.metodo_pago || 'Pago Móvil',
        meses_pagados: transaction.meses_pagados || 1,
        referencia: transaction.referencia || '',
        nota: transaction.nota || '',
        fecha_pago: dateStr
      });
      setConfirmDelete(false);
      setError(null);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleMontoUsdChange = (val) => {
    const usd = Number(val);
    const tasa = Number(formData.tasa_bcv_aplicada);
    setFormData(prev => ({
      ...prev,
      monto_usd_base: val,
      monto_ves_cobrado: tasa && !isNaN(usd) ? Number((usd * tasa).toFixed(2)) : prev.monto_ves_cobrado
    }));
  };

  const handleTasaChange = (val) => {
    const tasa = Number(val);
    const usd = Number(formData.monto_usd_base);
    setFormData(prev => ({
      ...prev,
      tasa_bcv_aplicada: val,
      monto_ves_cobrado: usd && !isNaN(tasa) ? Number((usd * tasa).toFixed(2)) : prev.monto_ves_cobrado
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(transaction.id, formData);
      triggerHaptic('medium');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(transaction.id, transaction.id_cliente);
      triggerHaptic('heavy');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Editar Registro de Cobro
            </h2>
            <p className="text-xs text-slate-400">
              {transaction.nombre_negocio} • ID: {transaction.id?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Nombre Comercio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre del Negocio
            </label>
            <input
              type="text"
              value={formData.nombre_negocio}
              onChange={(e) => setFormData({ ...formData, nombre_negocio: e.target.value })}
              className="w-full py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Montos y Tasa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Monto USD ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.monto_usd_base}
                onChange={(e) => handleMontoUsdChange(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tasa BCV (Bs/$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.tasa_bcv_aplicada}
                onChange={(e) => handleTasaChange(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Total en Bs
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.monto_ves_cobrado}
                onChange={(e) => setFormData({ ...formData, monto_ves_cobrado: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-emerald-400 font-semibold focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Método de Pago y Meses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Método de Pago
              </label>
              <select
                value={formData.metodo_pago}
                onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Pago Móvil">Pago Móvil</option>
                <option value="Efectivo USD">Efectivo USD</option>
                <option value="Efectivo VES">Efectivo VES</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Meses Pagados
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={formData.meses_pagados}
                onChange={(e) => setFormData({ ...formData, meses_pagados: Number(e.target.value) })}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Referencia y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                N° Referencia Bancaria (Opcional)
              </label>
              <input
                type="text"
                placeholder="ej. 849201"
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fecha de Pago
              </label>
              <input
                type="datetime-local"
                value={formData.fecha_pago}
                onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Nota interna */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nota / Observación (Opcional)
            </label>
            <input
              type="text"
              placeholder="ej. Pago adelantado de 2 meses con descuento"
              value={formData.nota}
              onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
              className="w-full py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Botones de acción */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Botón de Borrado */}
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Cobro</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-900/30 active:scale-95"
                >
                  {deleting ? 'Eliminando...' : '¿Confirmar Borrado?'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Guardar cambios */}
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-900/30 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
}
