import React, { useState } from 'react';
import { 
  MessageCircle, 
  CreditCard, 
  MapPin, 
  User, 
  Calendar, 
  MoreVertical, 
  Edit, 
  Trash2, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Clock,
  KeyRound
} from 'lucide-react';
import { generateWhatsAppLink } from '../utils/phone';

// Generates consistent soft color styling for app badge based on app name
function getAppBadgeColor(appName = '') {
  const hash = appName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorSchemes = [
    'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'bg-teal-500/10 text-teal-400 border-teal-500/20',
    'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  ];
  return colorSchemes[hash % colorSchemes.length];
}

export default function ClientCard({ 
  client, 
  bcvRate, 
  onRegisterPayment, 
  onEditClient, 
  onDeleteClient 
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const tarifaUsd = Number(client.tarifa_base_usd) || 0;
  const montoVes = tarifaUsd * (Number(bcvRate) || 0);

  // Status calculations
  const estadoCliente = client.estado_cliente || (client.estado_pago ? 'SOLVENTE' : 'MOROSO');
  const isTrial = estadoCliente === 'EN_PRUEBA';
  const isTrialExpired = estadoCliente === 'PRUEBA_VENCIDA';
  const isOverdue = estadoCliente === 'MOROSO' || isTrialExpired;

  // Dates
  const dueDate = client.fecha_proximo_pago?.toDate 
    ? client.fecha_proximo_pago.toDate() 
    : new Date(client.fecha_proximo_pago?.seconds ? client.fecha_proximo_pago.seconds * 1000 : client.fecha_proximo_pago);

  const trialEndDate = client.fecha_fin_prueba?.toDate
    ? client.fecha_fin_prueba.toDate()
    : (client.fecha_fin_prueba ? new Date(client.fecha_fin_prueba.seconds ? client.fecha_fin_prueba.seconds * 1000 : client.fecha_fin_prueba) : null);

  const now = new Date();
  const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

  // Copy ID to clipboard
  const handleCopyId = (e) => {
    e.stopPropagation();
    if (!client.id_externo) return;
    navigator.clipboard.writeText(client.id_externo);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // WhatsApp Reminder Link
  const whatsappUrl = generateWhatsAppLink({
    encargado: client.encargado,
    appSuscrita: client.app_suscrita,
    nombreNegocio: client.nombre_negocio,
    tarifaUsd,
    valorBcv: bcvRate,
    telefono: client.telefono,
    estadoCliente,
    fechaFinPrueba: trialEndDate ? trialEndDate.toLocaleDateString('es-VE') : null,
    diasRestantesPrueba: client.dias_restantes_prueba
  });

  // Top accent bar color
  const getStripColor = () => {
    if (isTrial) return 'bg-purple-500';
    if (isTrialExpired) return 'bg-amber-500';
    if (estadoCliente === 'MOROSO') return 'bg-rose-500';
    return 'bg-emerald-500';
  };

  return (
    <div className={`rounded-2xl border transition-all duration-200 relative group overflow-hidden ${
      isOverdue 
        ? isTrialExpired 
          ? 'bg-amber-950/15 border-amber-500/40 hover:border-amber-500/60 shadow-lg shadow-amber-950/20'
          : 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60 shadow-lg shadow-rose-950/30' 
        : isTrial
          ? 'bg-purple-950/15 border-purple-500/30 hover:border-purple-500/50 shadow-md'
          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 shadow-md'
    }`}>
      
      {/* Top Accent Strip */}
      <div className={`h-1.5 w-full ${getStripColor()}`} />

      <div className="p-5">
        
        {/* Header: Title, Badges, and Context Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              
              {/* App Category Badge */}
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getAppBadgeColor(client.app_suscrita)}`}>
                {client.app_suscrita || 'General'}
              </span>
              
              {/* Dynamic Status Badge */}
              {isTrial ? (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  En Prueba ({client.dias_restantes_prueba !== null ? `${client.dias_restantes_prueba}d` : 'Activa'})
                </span>
              ) : isTrialExpired ? (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Prueba Vencida (Cobrar 1er Mes)
                </span>
              ) : estadoCliente === 'MOROSO' ? (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Moroso ({Math.abs(diffDays)}d)
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Solvente {diffDays <= 5 ? `(${diffDays}d restantes)` : ''}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight truncate" title={client.nombre_negocio}>
              {client.nombre_negocio}
            </h3>

            {/* Fixed ID badge with Copy Button */}
            {client.id_externo ? (
              <div className="mt-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyId}
                  title="Clic para copiar ID de la App"
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors group/id"
                >
                  <KeyRound className="w-3 h-3 text-slate-500 group-hover/id:text-emerald-400" />
                  <span className="truncate max-w-[180px]">{client.id_externo}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400 ml-0.5" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-500 opacity-60 group-hover/id:opacity-100 ml-0.5" />
                  )}
                </button>
                {copiedId && (
                  <span className="text-[10px] text-emerald-400 font-medium animate-in fade-in">
                    ¡Copiado!
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {/* Context Menu Button */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-30 w-36 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-1 text-xs">
                  <button
                    onClick={() => { setMenuOpen(false); onEditClient(client); }}
                    className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-700/80 flex items-center gap-2"
                  >
                    <Edit className="w-3.5 h-3.5 text-blue-400" />
                    Editar
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDeleteClient(client); }}
                    className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Desactivar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contact & Location Details */}
        <div className="mt-4 space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-300 font-medium truncate">
              {client.encargado || 'Sin encargado'}
            </span>
            {client.cedula && (
              <span className="text-slate-500 text-[11px] font-mono">
                • V-{client.cedula}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">
              {client.direccion ? `${client.direccion} - ` : ''}
              <span className="text-slate-300 font-medium">{client.estado_region || 'Cojedes'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            {isTrial ? (
              <span>
                Prueba hasta: <strong className="text-purple-300">
                  {trialEndDate ? trialEndDate.toLocaleDateString('es-VE') : 'En curso'}
                </strong>
              </span>
            ) : isTrialExpired ? (
              <span>
                Prueba finalizada: <strong className="text-amber-400">
                  Requiere cobro del 1er mes
                </strong>
              </span>
            ) : (
              <span>
                Próximo corte: <strong className={isOverdue ? 'text-rose-400' : 'text-slate-200'}>
                  {dueDate ? dueDate.toLocaleDateString('es-VE') : 'Por definir'}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Pricing Banner */}
        <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {isTrial ? 'Tarifa Post-Prueba' : 'Tarifa Mensual'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-white">${tarifaUsd.toFixed(2)}</span>
              <span className="text-[10px] text-slate-400">USD</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Monto en Bolívares</span>
            <div className="text-sm font-bold text-emerald-400">
              ≈ {montoVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          
          {/* WhatsApp Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Enviar recordatorio por WhatsApp"
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all active:scale-95 ${
              isOverdue
                ? isTrialExpired
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/30 ring-2 ring-amber-500/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 ring-2 ring-emerald-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          {/* Register Payment Button */}
          <button
            onClick={() => onRegisterPayment(client)}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95 text-white ${
              isTrialExpired 
                ? 'bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 shadow-amber-900/20'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/20'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{isTrialExpired ? 'Cobrar 1er Mes' : 'Cobrar'}</span>
          </button>

        </div>

      </div>
    </div>
  );
}
