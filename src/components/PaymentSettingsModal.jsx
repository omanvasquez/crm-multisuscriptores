import React, { useState, useEffect } from 'react';
import { X, Settings, CheckCircle2, Shield, Smartphone, FileJson, Building2 } from 'lucide-react';
import { DEFAULT_PAGO_MOVIL } from '../utils/phone';
import { triggerHaptic } from '../utils/haptics';

export default function PaymentSettingsModal({ 
  isOpen, 
  onClose, 
  config, 
  onSave, 
  onExportJson 
}) {
  const [formData, setFormData] = useState(DEFAULT_PAGO_MOVIL);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        banco: config.banco || DEFAULT_PAGO_MOVIL.banco,
        bancoCodigo: config.bancoCodigo || DEFAULT_PAGO_MOVIL.bancoCodigo,
        cedula: config.cedula || DEFAULT_PAGO_MOVIL.cedula,
        telefono: config.telefono || DEFAULT_PAGO_MOVIL.telefono,
        titular: config.titular || DEFAULT_PAGO_MOVIL.titular
      });
    } else {
      setFormData(DEFAULT_PAGO_MOVIL);
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      triggerHaptic('medium');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving payment settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative transition-colors duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Ajustes de Cobranza & Cuentas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Datos para Pago Móvil y mensajes de WhatsApp
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>¡Datos de Pago Móvil actualizados en Firestore!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de Banco & Código
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="ej. Banco de Venezuela"
                value={formData.banco}
                onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                className="col-span-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
              <input
                type="text"
                placeholder="ej. 0102"
                value={formData.bancoCodigo}
                onChange={(e) => setFormData({ ...formData, bancoCodigo: e.target.value })}
                className="col-span-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cédula / RIF
              </label>
              <input
                type="text"
                placeholder="ej. 19.888.063"
                value={formData.cedula}
                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono Pago Móvil
              </label>
              <input
                type="text"
                placeholder="ej. 04124169949"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Titular
            </label>
            <input
              type="text"
              placeholder="ej. Oman Vásquez"
              value={formData.titular}
              onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Datos de Pago Móvil'}</span>
            </button>
          </div>

        </form>

        {/* Sección de Respaldo JSON */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileJson className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Copia de Seguridad Completa</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Descarga un archivo .JSON con todos tus clientes y transacciones
              </p>
            </div>
            <button
              type="button"
              onClick={onExportJson}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
            >
              Descargar JSON
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
