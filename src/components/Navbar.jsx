import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  TrendingUp, 
  LogOut, 
  ExternalLink, 
  History, 
  PlusCircle,
  FileSpreadsheet,
  Settings,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar({ 
  bcvData, 
  onOpenBcvModal, 
  onOpenNewClientModal,
  onOpenTransactions,
  onExportClients,
  onOpenSettings,
  clientsCount
}) {
  const { currentUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const formattedRate = bcvData?.rate 
    ? Number(bcvData.rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '--';

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Project Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
              MS
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                CRM Multi-Suscripciones
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Admin
                </span>
              </h1>
              <a 
                href="https://oman-vasquez.web.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 group"
              >
                <span>Por <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 dark:group-hover:text-emerald-300">Oman Vásquez</span></span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
              </a>
            </div>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Theme Toggle Button (Sol / Luna) */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-all"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in zoom-in duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 animate-in zoom-in duration-200" />
              )}
            </button>

            {/* BCV Rate Pill */}
            <button
              onClick={onOpenBcvModal}
              title="Clic para cambiar o refrescar la tasa BCV"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50 transition-all text-xs group"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></div>
              <div className="flex items-center gap-1 font-medium">
                <span className="text-slate-500 dark:text-slate-400 hidden xs:inline">BCV:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formattedRate}</span>
                <span className="text-[10px] text-slate-400">Bs/$</span>
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
            </button>

            {/* View History */}
            <button
              onClick={onOpenTransactions}
              title="Historial de Cobros"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/80 transition-all"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Export CSV */}
            <button
              onClick={onExportClients}
              title="Exportar Clientes a Excel / CSV"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700/80 transition-all hidden sm:flex items-center"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            {/* Settings (Pago Móvil / Cuentas / Respaldo) */}
            <button
              onClick={onOpenSettings}
              title="Ajustes de Cobro y Cuentas"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/80 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Quick Add Button */}
            <button
              onClick={onOpenNewClientModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Comercio</span>
            </button>

            {/* User Profile / Logout */}
            <div className="flex items-center pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800 gap-2">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'Admin'} 
                  className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  OV
                </div>
              )}
              <button
                onClick={logout}
                title="Cerrar Sesión"
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
