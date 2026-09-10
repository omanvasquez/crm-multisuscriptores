import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Layers, 
  Shield, 
  KeyRound, 
  Sparkles, 
  Clock 
} from 'lucide-react';

export default function ClientModal({ isOpen, onClose, onSave, clientToEdit, existingApps = [] }) {
  const [formData, setFormData] = useState({
    id_externo: '',
    nombre_negocio: '',
    app_suscrita: '',
    encargado: '',
    cedula: '',
    telefono: '',
    direccion: '',
    estado_region: 'Cojedes',
    tarifa_base_usd: 5,
    en_periodo_prueba: false,
    dias_prueba: 14,
    fecha_fin_prueba: '',
    fecha_inicio_contrato: new Date().toISOString().slice(0, 10),
    fecha_proximo_pago: new Date().toISOString().slice(0, 10),
    primer_pago_inmediato: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Helper to compute trial end date given a start date and number of days
  const computeTrialEnd = (startStr, daysCount) => {
    const start = startStr ? new Date(startStr) : new Date();
    const end = new Date(start.getTime() + (Number(daysCount) || 14) * 24 * 60 * 60 * 1000);
    return end.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (clientToEdit) {
      const formatDate = (dateObj) => {
        if (!dateObj) return '';
        const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj.seconds ? dateObj.seconds * 1000 : dateObj);
        return d.toISOString().slice(0, 10);
      };

      const isTrial = Boolean(clientToEdit.en_periodo_prueba);
      const days = clientToEdit.dias_prueba || 14;
      const startDate = formatDate(clientToEdit.fecha_inicio_contrato) || new Date().toISOString().slice(0, 10);
      const trialEndDate = formatDate(clientToEdit.fecha_fin_prueba) || (isTrial ? computeTrialEnd(startDate, days) : '');

      setFormData({
        id_externo: clientToEdit.id_externo || '',
        nombre_negocio: clientToEdit.nombre_negocio || '',
        app_suscrita: clientToEdit.app_suscrita || '',
        encargado: clientToEdit.encargado || '',
        cedula: clientToEdit.cedula || '',
        telefono: clientToEdit.telefono || '',
        direccion: clientToEdit.direccion || '',
        estado_region: clientToEdit.estado_region || 'Cojedes',
        tarifa_base_usd: clientToEdit.tarifa_base_usd || 5,
        en_periodo_prueba: isTrial,
        dias_prueba: days,
        fecha_fin_prueba: trialEndDate,
        fecha_inicio_contrato: startDate,
        fecha_proximo_pago: formatDate(clientToEdit.fecha_proximo_pago) || startDate,
        primer_pago_inmediato: Boolean(clientToEdit.fecha_ultimo_pago),
      });
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      setFormData({
        id_externo: '',
        nombre_negocio: '',
        app_suscrita: existingApps[0] || 'BodegasPro',
        encargado: '',
        cedula: '',
        telefono: '',
        direccion: '',
        estado_region: 'Cojedes',
        tarifa_base_usd: 5,
        en_periodo_prueba: false,
        dias_prueba: 14,
        fecha_fin_prueba: computeTrialEnd(todayStr, 14),
        fecha_inicio_contrato: todayStr,
        fecha_proximo_pago: todayStr,
        primer_pago_inmediato: true,
      });
    }
    setError(null);
  }, [clientToEdit, isOpen, existingApps]);

  const handleTrialToggle = (enabled) => {
    const end = enabled ? computeTrialEnd(formData.fecha_inicio_contrato, formData.dias_prueba) : '';
    setFormData({
      ...formData,
      en_periodo_prueba: enabled,
      fecha_fin_prueba: end
    });
  };

  const handleTrialDaysChange = (days) => {
    const end = computeTrialEnd(formData.fecha_inicio_contrato, days);
    setFormData({
      ...formData,
      dias_prueba: days,
      fecha_fin_prueba: end
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre_negocio.trim()) {
      setError('El nombre del negocio es obligatorio.');
      return;
    }
    if (!formData.telefono.trim()) {
      setError('El número de teléfono es obligatorio para enviar recordatorios por WhatsApp.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(formData, clientToEdit?.id);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Error al guardar el cliente: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          {clientToEdit ? 'Editar Comercio' : 'Registrar Nuevo Comercio'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {clientToEdit 
            ? 'Actualiza los datos del comercio suscrito.'
            : 'Ingresa los datos para control de cobranza recurrente.'}
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* Row 1: Nombre Negocio & App Suscrita */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre del Negocio *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Bodega Don Pedro"
                value={formData.nombre_negocio}
                onChange={(e) => setFormData({ ...formData, nombre_negocio: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                App Suscrita (Categoría) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  list="apps-list"
                  placeholder="Ej. BodegasPro, GymControl"
                  value={formData.app_suscrita}
                  onChange={(e) => setFormData({ ...formData, app_suscrita: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <datalist id="apps-list">
                  {existingApps.map((app) => (
                    <option key={app} value={app} />
                  ))}
                  <option value="BodegasPro" />
                  <option value="GymControl" />
                  <option value="FacturaFácil" />
                  <option value="FarmaciaPOS" />
                </datalist>
              </div>
            </div>
          </div>

          {/* Row 2: ID Único / Fijo de la App */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                ID Fijo de la App / Base de Datos
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Alfanumérico y caracteres especiales (invariable)
              </span>
            </label>
            <input
              type="text"
              placeholder="Ej. usr_84fa-92#x1, BP-0049-C, tenant_gym_99"
              value={formData.id_externo}
              onChange={(e) => setFormData({ ...formData, id_externo: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:font-sans placeholder:text-slate-600"
            />
          </div>

          {/* Row 3: Encargado & Cédula */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre del Encargado / Dueño
              </label>
              <input
                type="text"
                placeholder="Ej. Pedro Pérez"
                value={formData.encargado}
                onChange={(e) => setFormData({ ...formData, encargado: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cédula / RIF
              </label>
              <input
                type="text"
                placeholder="Ej. 19888063 o J-12345678"
                value={formData.cedula}
                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 4: Teléfono & Estado/Región */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Teléfono de Contacto (WhatsApp) *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. 04124169949"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Se normalizará automáticamente a formato +58.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estado / Región
              </label>
              <input
                type="text"
                placeholder="Ej. Cojedes - Tinaquillo"
                value={formData.estado_region}
                onChange={(e) => setFormData({ ...formData, estado_region: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 5: Dirección Física */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Dirección / Local / Punto de Referencia
            </label>
            <input
              type="text"
              placeholder="Ej. Av. Bolívar frente a la plaza, Local #3"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Row 6: Tarifa USD & Fecha Registro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tarifa Mensual ($USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={formData.tarifa_base_usd}
                  onChange={(e) => setFormData({ ...formData, tarifa_base_usd: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Fecha de Registro / Inicio
              </label>
              <input
                type="date"
                value={formData.fecha_inicio_contrato}
                onChange={(e) => {
                  const newStart = e.target.value;
                  const newEnd = formData.en_periodo_prueba ? computeTrialEnd(newStart, formData.dias_prueba) : '';
                  setFormData({ 
                    ...formData, 
                    fecha_inicio_contrato: newStart,
                    fecha_fin_prueba: newEnd 
                  });
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 7: Trial Period Configuration */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.en_periodo_prueba}
                  onChange={(e) => handleTrialToggle(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  ¿Tiene período de prueba gratuito?
                </span>
              </label>
              {formData.en_periodo_prueba && (
                <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  Sin costo inicial
                </span>
              )}
            </div>

            {formData.en_periodo_prueba ? (
              <div className="pt-2 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">Duración:</span>
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleTrialDaysChange(d)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        Number(formData.dias_prueba) === d
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {d} días
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={formData.dias_prueba}
                      onChange={(e) => handleTrialDaysChange(Number(e.target.value))}
                      className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-center text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-xs text-slate-500">días</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-200">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>La prueba finaliza el:</span>
                  </div>
                  <span className="font-bold text-purple-300">
                    {formData.fecha_fin_prueba ? new Date(formData.fecha_fin_prueba + 'T00:00:00').toLocaleDateString('es-VE') : 'N/A'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  💡 Durante este período el comercio no debe dinero. Al vencer, le tocará pagar su <strong>primer mes por adelantado</strong>.
                </p>
              </div>
            ) : (
              !clientToEdit && (
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.primer_pago_inmediato}
                      onChange={(e) => setFormData({ ...formData, primer_pago_inmediato: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                    />
                    <span>
                      El comercio ya pagó el primer mes por adelantado (Solvente hasta el próximo mes)
                    </span>
                  </label>
                  {!formData.primer_pago_inmediato && (
                    <p className="text-[11px] text-amber-400/90 mt-1.5 ml-6">
                      ⚠️ Se creará con cobro pendiente para hoy (prepago).
                    </p>
                  )}
                </div>
              )
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : clientToEdit ? 'Actualizar Comercio' : 'Registrar Comercio'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
