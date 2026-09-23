import React, { useState } from 'react';
import { X, TrendingUp, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { saveManualBcvRate } from '../services/bcvService';

export default function BcvModal({ isOpen, onClose, bcvData, onRateUpdated }) {
  const [manualRate, setManualRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentRate = bcvData?.rate || 0;
  const lastUpdated = bcvData?.updatedAt ? new Date(bcvData.updatedAt).toLocaleString('es-VE') : 'No disponible';
  const source = bcvData?.source === 'dolarapi' ? 'DolarAPI (Oficial BCV)' : bcvData?.source === 'manual' ? 'Modificado manualmente' : 'Caché';

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const updated = await saveManualBcvRate(manualRate);
      setSuccess(true);
      if (onRateUpdated) {
        onRateUpdated(updated);
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative transition-colors duration-150">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Tasa Oficial BCV
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control de conversión oficial USD a Bolívares (VES).
            </p>
          </div>
        </div>

        {/* Current status */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Tasa activa:</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {Number(currentRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/$
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Origen:</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">{source}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Última actualización:</span>
            <span className="text-slate-700 dark:text-slate-300">{lastUpdated}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Tasa actualizada correctamente</span>
          </div>
        )}

        {/* Manual adjustment */}
        <form onSubmit={handleSave} className="mt-6">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Ajustar Tasa Manualmente (Fallback)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="1"
              required
              placeholder={currentRate.toString()}
              value={manualRate}
              onChange={(e) => setManualRate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">
              Bs/$
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Úsalo si la API no está disponible o requieres ajustar el valor del día inmediatamente.
          </p>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading || !manualRate}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Fijar Tasa Manual'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
