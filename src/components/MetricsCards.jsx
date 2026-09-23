import React from 'react';
import { Users, AlertTriangle, CheckCircle2, DollarSign, Wallet, Target } from 'lucide-react';

export default function MetricsCards({ clients, bcvRate, transactions }) {
  const activeClients = clients.filter(c => c.activo !== false && !c.suspendido);
  const suspendedClients = clients.filter(c => c.activo !== false && c.suspendido);
  const totalCount = activeClients.length;
  
  const trialClients = activeClients.filter(c => c.estado_cliente === 'EN_PRUEBA');
  const solventClients = activeClients.filter(c => c.estado_cliente === 'SOLVENTE');
  const upcomingClients = activeClients.filter(c => c.estado_cliente === 'POR_VENCER');
  const delinquentClients = activeClients.filter(c => c.estado_cliente === 'MOROSO' || c.estado_cliente === 'PRUEBA_VENCIDA');

  // MRR (Monthly Recurring Revenue / Tarifa mensual base contratada)
  const projectedUsd = activeClients.reduce((sum, c) => sum + (Number(c.tarifa_base_usd) || 0), 0);
  const projectedVes = projectedUsd * (Number(bcvRate) || 0);

  // Monthly collected: sum of transactions recorded in the current calendar month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthTransactions = (transactions || []).filter(t => {
    if (!t.fecha_pago) return false;
    const date = t.fecha_pago.toDate ? t.fecha_pago.toDate() : new Date(t.fecha_pago.seconds ? t.fecha_pago.seconds * 1000 : t.fecha_pago);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  });

  const collectedUsd = currentMonthTransactions.reduce((sum, t) => sum + (Number(t.monto_usd_base) || 0), 0);
  const collectedVes = currentMonthTransactions.reduce((sum, t) => sum + (Number(t.monto_ves_cobrado) || 0), 0);

  const goalPercentage = projectedUsd > 0 ? Math.min(100, Math.round((collectedUsd / projectedUsd) * 100)) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      
      {/* 1. Clientes Activos */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cartera Activa</span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{totalCount}</span>
          <span className="text-xs text-slate-400">comercios</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          <span>{trialClients.length} en prueba {suspendedClients.length > 0 ? `• ${suspendedClients.length} susp.` : ''}</span>
        </div>
      </div>

      {/* 2. Semáforo de Morosidad & Por Vencer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado de Cobro</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-emerald-400">{solventClients.length}</span>
            <span className="text-[10px] font-medium text-emerald-500">Al día</span>
          </div>
          <div className="h-5 w-px bg-slate-800"></div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-amber-400">{upcomingClients.length}</span>
            <span className="text-[10px] font-medium text-amber-400">Pronto</span>
          </div>
          <div className="h-5 w-px bg-slate-800"></div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-rose-400">{delinquentClients.length}</span>
            <span className="text-[10px] font-medium text-rose-500">Mora</span>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 truncate">
          {delinquentClients.length > 0 ? (
            <span className="text-rose-400 font-medium">⚠️ {delinquentClients.length} morosos requieren cobro</span>
          ) : upcomingClients.length > 0 ? (
            <span className="text-amber-400 font-medium">⏳ {upcomingClients.length} por vencer esta semana</span>
          ) : (
            <span className="text-emerald-400 font-medium">✨ Cartera 100% al día</span>
          )}
        </div>
      </div>

      {/* 3. Proyección Mensual (MRR) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MRR Proyectado</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold text-white">${projectedUsd.toFixed(2)}</span>
          <span className="text-xs text-slate-400">USD/mes</span>
        </div>
        <div className="mt-2 text-[11px] text-emerald-400 font-medium truncate">
          ≈ {projectedVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
        </div>
      </div>

      {/* 4. Recaudado en el Mes + Barra de Progreso */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recaudado Mes</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
              {goalPercentage}%
            </span>
          </div>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold text-teal-400">${collectedUsd.toFixed(2)}</span>
          <span className="text-xs text-slate-400">USD</span>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-2.5 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${goalPercentage}%` }}
          />
        </div>
      </div>

    </div>
  );
}
