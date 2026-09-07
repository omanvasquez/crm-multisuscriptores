import React, { useState, useEffect } from 'react';
import { X, Building2, User, Phone, MapPin, DollarSign, Calendar, Layers, Shield } from 'lucide-react';

export default function ClientModal({ isOpen, onClose, onSave, clientToEdit, existingApps = [] }) {
  const [formData, setFormData] = useState({
    nombre_negocio: '',
    app_suscrita: '',
    encargado: '',
    cedula: '',
    telefono: '',
    direccion: '',
    estado_region: 'Cojedes',
    tarifa_base_usd: 5,
    fecha_inicio_contrato: new Date().toISOString().slice(0, 10),
    fecha_proximo_pago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (clientToEdit) {
      const formatDate = (dateObj) => {
        if (!dateObj) return new Date().toISOString().slice(0, 10);
        const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj.seconds ? dateObj.seconds * 1000 : dateObj);
        return d.toISOString().slice(0, 10);
      };

      setFormData({
        nombre_negocio: clientToEdit.nombre_negocio || '',
        app_suscrita: clientToEdit.app_suscrita || '',
        encargado: clientToEdit.encargado || '',
        cedula: clientToEdit.cedula || '',
        telefono: clientToEdit.telefono || '',
        direccion: clientToEdit.direccion || '',
        estado_region: clientToEdit.estado_region || 'Cojedes',
        tarifa_base_usd: clientToEdit.tarifa_base_usd || 5,
        fecha_inicio_contrato: formatDate(clientToEdit.fecha_inicio_contrato),
        fecha_proximo_pago: formatDate(clientToEdit.fecha_proximo_pago),
      });
    } else {
      setFormData({
        nombre_negocio: '',
        app_suscrita: existingApps[0] || 'BodegasPro',
        encargado: '',
        cedula: '',
        telefono: '',
        direccion: '',
        estado_region: 'Cojedes',
        tarifa_base_usd: 5,
        fecha_inicio_contrato: new Date().toISOString().slice(0, 10),
        fecha_proximo_pago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      });
    }
    setError(null);
  }, [clientToEdit, isOpen, existingApps]);

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
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ej. Bodega Don Pedro"
                  value={formData.nombre_negocio}
                  onChange={(e) => setFormData({ ...formData, nombre_negocio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
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

          {/* Row 2: Encargado & Cédula */}
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

          {/* Row 3: Teléfono & Estado/Región */}
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

          {/* Row 4: Dirección Física */}
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

          {/* Row 5: Tarifa USD & Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
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
                Inicio Contrato
              </label>
              <input
                type="date"
                value={formData.fecha_inicio_contrato}
                onChange={(e) => setFormData({ ...formData, fecha_inicio_contrato: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Próximo Corte / Pago
              </label>
              <input
                type="date"
                value={formData.fecha_proximo_pago}
                onChange={(e) => setFormData({ ...formData, fecha_proximo_pago: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
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
