import React from 'react';
import { Users, AlertTriangle, CheckCircle2, DollarSign, Wallet } from 'lucide-react';

export default function MetricsCards({ clients, bcvRate, transactions }) {
  const activeClients = clients.filter(c => c.activo !== false && !c.suspendido);
  const suspendedClients = clients.filter(c => c.activo !== false && c.suspendido);
  const totalCount = activeClients.length;
  
  const trialClients = activeClients.filter(c => c.estado_cliente === 'EN_PRUEBA');
  const solventClients = activeClients.filter(c => c.estado_cliente === 'SOLVENTE');
  const delinquentClients = activeClients.filter(c => c.estado_cliente === 'MOROSO' || c.estado_cliente === 'PRUEBA_VENCIDA');

  // Monthly projection (sum of active clients tarifa_base_usd)
  const projectedUsd = activeClients.reduce((sum, c) => sum + (Number(c.tarifa_base_usd) || 0), 0);
  const projectedVes = projectedUsd * (Number(bcvRate) || 0);

  // Monthly collected: sum of transactions recorded in the current month
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

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      
      {/* 1. Clientes Activos */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clientes Activos</span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{totalCount}</span>
          <span className="text-xs text-slate-400">negocios</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          <span>{trialClients.length} en prueba {suspendedClients.length > 0 ? `• ${suspendedClients.length} suspendidos` : ''}</span>
        </div>
      </div>

      {/* 2. Semáforo de Morosidad & Prueba */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado de Cobro</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400">{solventClients.length}</span>
            <span className="text-[10px] font-medium text-emerald-500">Al día</span>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-purple-400">{trialClients.length}</span>
            <span className="text-[10px] font-medium text-purple-400">Prueba</span>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-rose-400">{delinquentClients.length}</span>
            <span className="text-[10px] font-medium text-rose-500">Cobrar</span>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 truncate">
          {delinquentClients.length > 0 ? (
            <span className="text-rose-400 font-medium">⚠️ {delinquentClients.length} morosos activos</span>
          ) : (
            <span className="text-emerald-400 font-medium">✨ Clientes activos al día</span>
          )}
        </div>
      </div>

      {/* 3. Proyección del Mes */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proyección Mensual</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold text-white">${projectedUsd.toFixed(2)}</span>
          <span className="text-xs text-slate-400">USD</span>
        </div>
        <div className="mt-2 text-[11px] text-emerald-400 font-medium truncate">
          ≈ {projectedVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
        </div>
      </div>

      {/* 4. Recaudado en el Mes */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recaudado este Mes</span>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold text-teal-400">${collectedUsd.toFixed(2)}</span>
          <span className="text-xs text-slate-400">USD</span>
        </div>
        <div className="mt-2 text-[11px] text-teal-300 font-medium truncate">
          {collectedVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs recaudados
        </div>
      </div>

    </div>
  );
}
