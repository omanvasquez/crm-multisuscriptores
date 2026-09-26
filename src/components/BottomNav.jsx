import React from 'react';
import { 
  Building2, 
  AlertCircle, 
  Clock, 
  History, 
  TrendingUp, 
  Settings,
  Sun,
  Moon,
  CalendarCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { triggerHaptic } from '../utils/haptics';

export default function BottomNav({
  statusFilter,
  onSelectFilter,
  delinquentCount = 0,
  upcomingCount = 0,
  todayCount = 0,
  onOpenTransactions,
  onOpenBcv,
  onOpenSettings
}) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="fixed bottom-0 inset-x-0 sm:hidden z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb transition-colors duration-150">
      
      {/* 1. Todos los Clientes */}
      <button
        type="button"
        onClick={() => {
          onSelectFilter('ALL');
          triggerHaptic('light');
        }}
        className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-colors ${
          statusFilter === 'ALL'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <Building2 className="w-4 h-4" />
        <span className="text-[10px]">Cartera</span>
      </button>

      {/* 2. Cobros de Hoy */}
      <button
        type="button"
        onClick={() => {
          onSelectFilter('TODAY');
          triggerHaptic('light');
        }}
        className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl relative transition-colors ${
          statusFilter === 'TODAY'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <CalendarCheck className="w-4 h-4" />
          {todayCount > 0 && (
            <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {todayCount > 99 ? '99+' : todayCount}
            </span>
          )}
        </div>
        <span className="text-[10px]">Hoy</span>
      </button>

      {/* 2. Morosos */}
      <button
        type="button"
        onClick={() => {
          onSelectFilter('DELINQUENT');
          triggerHaptic('light');
        }}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl relative transition-colors ${
          statusFilter === 'DELINQUENT'
            ? 'text-rose-600 dark:text-rose-400 font-bold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <AlertCircle className="w-4 h-4" />
          {delinquentCount > 0 && (
            <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
              {delinquentCount}
            </span>
          )}
        </div>
        <span className="text-[10px]">Morosos</span>
      </button>

      {/* 3. Por Vencer */}
      <button
        type="button"
        onClick={() => {
          onSelectFilter('UPCOMING');
          triggerHaptic('light');
        }}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl relative transition-colors ${
          statusFilter === 'UPCOMING'
            ? 'text-amber-600 dark:text-amber-400 font-bold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Clock className="w-4 h-4" />
          {upcomingCount > 0 && (
            <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-amber-500 text-slate-950 rounded-full text-[9px] font-bold flex items-center justify-center">
              {upcomingCount}
            </span>
          )}
        </div>
        <span className="text-[10px]">Por Vencer</span>
      </button>

      {/* 4. Historial Transacciones */}
      <button
        type="button"
        onClick={() => {
          onOpenTransactions();
          triggerHaptic('light');
        }}
        className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
      >
        <History className="w-4 h-4" />
        <span className="text-[10px]">Cobros</span>
      </button>

      {/* 5. Tasa BCV */}
      <button
        type="button"
        onClick={() => {
          onOpenBcv();
          triggerHaptic('light');
        }}
        className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
      >
        <TrendingUp className="w-4 h-4" />
        <span className="text-[10px]">Tasa BCV</span>
      </button>

      {/* 6. Theme Toggle (Móvil) */}
      <button
        type="button"
        onClick={toggleTheme}
        className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 transition-colors"
        title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600" />
        )}
        <span className="text-[10px]">{isDark ? 'Claro' : 'Oscuro'}</span>
      </button>

      {/* 7. Ajustes */}
      <button
        type="button"
        onClick={() => {
          onOpenSettings();
          triggerHaptic('light');
        }}
        className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span className="text-[10px]">Ajustes</span>
      </button>

    </nav>
  );
}
