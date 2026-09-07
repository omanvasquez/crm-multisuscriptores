import React from 'react';
import { X, History, FileSpreadsheet, ArrowUpRight, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { exportTransactionsToCSV } from '../utils/exportCsv';

export default function TransactionsDrawer({ isOpen, onClose, transactions = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Historial de Cobros
                </h2>
                <p className="text-xs text-slate-400">
                  {transactions.length} registros auditables
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportTransactionsToCSV(transactions)}
                title="Exportar a CSV"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List of transactions */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {transactions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <CreditCard className="w-8 h-8 stroke-1 mb-2 text-slate-600" />
                <span>Aún no hay transacciones registradas.</span>
              </div>
            ) : (
              transactions.map((t) => {
                const date = t.fecha_pago?.toDate 
                  ? t.fecha_pago.toDate() 
                  : new Date(t.fecha_pago?.seconds ? t.fecha_pago.seconds * 1000 : t.fecha_pago || Date.now());

                return (
                  <div 
                    key={t.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {t.nombre_negocio || 'Comercio'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span>{t.metodo_pago || 'Pago Móvil'}</span>
                          <span>•</span>
                          <span>{date.toLocaleDateString('es-VE')} {date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-400">
                          +${Number(t.monto_usd_base || 0).toFixed(2)}
                        </span>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {Number(t.monto_ves_cobrado || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Tasa aplicada:</span>
                      <span className="font-mono text-slate-400">
                        {Number(t.tasa_bcv_aplicada || 0).toFixed(2)} Bs/$
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer of Drawer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center">
            <button
              onClick={() => exportTransactionsToCSV(transactions)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Descargar Reporte en Excel (.CSV)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
