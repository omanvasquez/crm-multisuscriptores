import React, { useState } from 'react';
import { 
  MessageCircle, 
  CreditCard, 
  Calendar, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  KeyRound, 
  PauseCircle, 
  PlayCircle, 
  History 
} from 'lucide-react';
import { generateWhatsAppLink } from '../utils/phone';
import { triggerHaptic } from '../utils/haptics';

// Generates consistent soft color styling for app badge based on app name
function getAppBadgeColor(appName = '') {
  const hash = appName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorSchemes = [
    'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
    'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
    'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  ];
  return colorSchemes[hash % colorSchemes.length];
}

export default function ClientCard({ 
  client, 
  bcvRate, 
  paymentConfig,
  onRegisterPayment, 
  onEditClient, 
  onDeleteClient,
  onToggleSuspend,
  onViewClientHistory
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const tarifaUsd = Number(client.tarifa_base_usd) || 0;
  const montoVes = tarifaUsd * (Number(bcvRate) || 0);

  // Status calculations
  const isSuspended = Boolean(client.suspendido);
  const estadoCliente = isSuspended ? 'SUSPENDIDO' : (client.estado_cliente || (client.estado_pago ? 'SOLVENTE' : 'MOROSO'));
  const isTrial = estadoCliente === 'EN_PRUEBA';
  const isTrialExpired = estadoCliente === 'PRUEBA_VENCIDA';
  const isUpcoming = estadoCliente === 'POR_VENCER';
  const isOverdue = (estadoCliente === 'MOROSO' || isTrialExpired) && !isSuspended;

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
    triggerHaptic('light');
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
    diasRestantesPrueba: client.dias_restantes_prueba,
    pagoMovilConfig: paymentConfig
  });

  // Top accent bar color
  const getStripColor = () => {
    if (isSuspended) return 'bg-slate-400 dark:bg-slate-500';
    if (isTrial) return 'bg-purple-500';
    if (isTrialExpired) return 'bg-amber-500';
    if (isUpcoming) return 'bg-amber-400';
    if (estadoCliente === 'MOROSO') return 'bg-rose-500';
    return 'bg-emerald-500';
  };

  return (
    <div className={`rounded-2xl border transition-all duration-150 relative group overflow-hidden ${
      isSuspended
        ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-80 hover:opacity-100 shadow-sm'
        : isOverdue 
          ? isTrialExpired 
            ? 'bg-amber-50/70 dark:bg-amber-950/15 border-amber-300 dark:border-amber-500/40 hover:border-amber-400 dark:hover:border-amber-500/60 shadow-sm'
            : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40 hover:border-rose-400 dark:hover:border-rose-500/60 shadow-sm' 
          : isUpcoming
            ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-500/30 hover:border-amber-400 dark:hover:border-amber-500/50 shadow-sm'
            : isTrial
              ? 'bg-purple-50/40 dark:bg-purple-950/15 border-purple-200 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-500/50 shadow-sm'
              : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
    }`}>
      
      {/* Top Accent Strip */}
      <div className={`h-1 w-full ${getStripColor()}`} />

      <div className="p-3.5 sm:p-4">
        
        {/* Row 1: Header (Badges + Business Name + Context Menu) */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getAppBadgeColor(client.app_suscrita)}`}>
                {client.app_suscrita || 'General'}
              </span>

              {/* Status Badge */}
              {isSuspended ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                  <PauseCircle className="w-2.5 h-2.5 text-slate-500" />
                  Susp.
                </span>
              ) : isTrial ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                  Prueba {client.dias_restantes_prueba !== null ? `${client.dias_restantes_prueba}d` : ''}
                </span>
              ) : isTrialExpired ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-amber-600" />
                  Prueba Vencida
                </span>
              ) : estadoCliente === 'MOROSO' ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Moroso ({Math.abs(diffDays)}d)
                </span>
              ) : isUpcoming ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-amber-600" />
                  Vence ({diffDays}d)
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Solvente {diffDays <= 7 ? `(${diffDays}d)` : ''}
                </span>
              )}
            </div>

            {/* Business Name */}
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate mt-1" title={client.nombre_negocio}>
              {client.nombre_negocio}
            </h3>
          </div>

          {/* Context Menu Button */}
          <div className="relative shrink-0 -mr-1 -mt-0.5">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Más opciones"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-30 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs">
                  <button
                    onClick={() => { setMenuOpen(false); onEditClient(client); }}
                    className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2"
                  >
                    <Edit className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    Editar Datos
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onViewClientHistory && onViewClientHistory(client); }}
                    className="w-full px-3 py-2 text-left text-teal-600 dark:text-teal-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2"
                  >
                    <History className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                    Ver Historial de Cobros
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onToggleSuspend && onToggleSuspend(client); }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 ${
                      isSuspended ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                    }`}
                  >
                    {isSuspended ? (
                      <>
                        <PlayCircle className="w-3.5 h-3.5" />
                        Reactivar Servicio
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-3.5 h-3.5" />
                        Suspender Servicio
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDeleteClient(client); }}
                    className="w-full px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Desactivar Comercio
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Row 2: Encargado / Ubicación / Próximo Corte */}
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
              {client.encargado || 'Sin encargado'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="truncate text-slate-500 dark:text-slate-400">
              {client.estado_region || 'Cojedes'}
            </span>
          </div>

          <div className="shrink-0 flex items-center gap-1 text-[11px]">
            <Calendar className="w-3 h-3 text-slate-400" />
            {isSuspended ? (
              <span className="text-slate-500">Suspendido</span>
            ) : isTrial ? (
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                Prueba: {trialEndDate ? trialEndDate.toLocaleDateString('es-VE') : '--'}
              </span>
            ) : isTrialExpired ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold">1er mes requerido</span>
            ) : (
              <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : isUpcoming ? 'text-amber-600 dark:text-amber-300 font-semibold' : 'text-slate-600 dark:text-slate-300 font-medium'}>
                Corte: {dueDate ? dueDate.toLocaleDateString('es-VE') : '--'}
              </span>
            )}
          </div>
        </div>

        {/* Optional compact ID tag if exists */}
        {client.id_externo && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={handleCopyId}
              title="Copiar ID de App"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 transition-colors"
            >
              <KeyRound className="w-2.5 h-2.5 text-slate-400" />
              <span>{client.id_externo}</span>
              {copiedId ? (
                <Check className="w-2.5 h-2.5 text-emerald-500" />
              ) : (
                <Copy className="w-2.5 h-2.5 opacity-50" />
              )}
            </button>
            {copiedId && <span className="text-emerald-500 font-sans">¡Copiado!</span>}
          </div>
        )}

        {/* Row 3: Pricing & Action Buttons in a single compact row */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          
          {/* Montos */}
          <div className="flex items-baseline gap-1.5 min-w-0">
            <div className="flex items-baseline gap-0.5">
              <span className="text-base font-extrabold text-slate-900 dark:text-white">${tarifaUsd.toFixed(2)}</span>
              <span className="text-[10px] text-slate-400">USD</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
              ≈ {montoVes.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Bs
            </span>
          </div>

          {/* Botones de acción compactos */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={isSuspended ? "Recontactar cliente" : "Enviar WhatsApp"}
              className={`p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center ${
                isSuspended
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  : isOverdue
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                    : isUpcoming
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            {/* Cobrar */}
            <button
              onClick={() => onRegisterPayment(client)}
              title={isSuspended ? 'Reactivar' : isTrialExpired ? 'Cobrar 1er Mes' : 'Cobrar'}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 text-white flex items-center gap-1.5 ${
                isSuspended
                  ? 'bg-gradient-to-r from-slate-600 to-emerald-600 hover:from-slate-500 hover:to-emerald-500'
                  : isTrialExpired 
                    ? 'bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isSuspended ? 'Reactivar' : isTrialExpired ? '1er Mes' : 'Cobrar'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
