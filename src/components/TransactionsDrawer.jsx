import React, { useState, useMemo } from 'react';
import { 
  X, 
  History, 
  FileSpreadsheet, 
  Edit, 
  Trash2, 
  MessageCircle, 
  Copy, 
  Check, 
  CreditCard,
  Building2,
  Filter,
  Search
} from 'lucide-react';
import { exportTransactionsToCSV } from '../utils/exportCsv';
import { generateReceiptWhatsAppLink, generateReceiptText } from '../utils/phone';
import { triggerHaptic } from '../utils/haptics';

export default function TransactionsDrawer({ 
  isOpen, 
  onClose, 
  transactions = [], 
  clients = [],
  clientFilter = null,
  onClearClientFilter,
  onEditTransaction,
  onDeleteTransaction
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Map clients by ID for quick phone/detail lookup
  const clientsMap = useMemo(() => {
    const map = {};
    clients.forEach(c => {
      map[c.id] = c;
    });
    return map;
  }, [clients]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (clientFilter && t.id_cliente !== clientFilter.id) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.nombre_negocio?.toLowerCase().includes(q);
        const matchMetodo = t.metodo_pago?.toLowerCase().includes(q);
        const matchRef = t.referencia?.toLowerCase().includes(q);
        const matchNota = t.nota?.toLowerCase().includes(q);
        return matchName || matchMetodo || matchRef || matchNota;
      }
      return true;
    });
  }, [transactions, clientFilter, searchQuery]);

  if (!isOpen) return null;

  const handleCopyReceipt = (t) => {
    const text = generateReceiptText({
      transactionId: t.id,
      nombreNegocio: t.nombre_negocio,
      appSuscrita: t.app_suscrita || 'General',
      idExterno: t.id_externo,
      montoUsd: t.monto_usd_base,
      tasaBcv: t.tasa_bcv_aplicada,
      montoVes: t.monto_ves_cobrado,
      metodoPago: t.metodo_pago,
      fechaPago: t.fecha_pago ? new Date(t.fecha_pago.seconds ? t.fecha_pago.seconds * 1000 : t.fecha_pago).toLocaleDateString('es-VE') : '',
      validoHasta: t.valido_hasta,
      mesesPagados: t.meses_pagados || 1,
      referencia: t.referencia,
      nota: t.nota
    });
    navigator.clipboard.writeText(text);
    setCopiedId(t.id);
    triggerHaptic('light');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-colors duration-150">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {clientFilter ? `Historial: ${clientFilter.nombre_negocio}` : 'Historial de Cobros'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {filteredTransactions.length} {filteredTransactions.length === 1 ? 'cobro registrado' : 'cobros registrados'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportTransactionsToCSV(filteredTransactions)}
                title="Exportar a CSV"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Client Filter Banner */}
          {clientFilter && (
            <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <span className="truncate">Filtrando por: <strong>{clientFilter.nombre_negocio}</strong></span>
              <button
                onClick={onClearClientFilter}
                className="text-[11px] underline font-semibold hover:text-emerald-950 dark:hover:text-white shrink-0 ml-2"
              >
                Ver todas
              </button>
            </div>
          )}

          {/* Search bar inside drawer */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/30">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por negocio, método o referencia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* List of transactions */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <CreditCard className="w-8 h-8 stroke-1 mb-2 text-slate-400 dark:text-slate-600" />
                <span>No se encontraron transacciones registradas.</span>
              </div>
            ) : (
              filteredTransactions.map((t) => {
                const date = t.fecha_pago?.toDate 
                  ? t.fecha_pago.toDate() 
                  : new Date(t.fecha_pago?.seconds ? t.fecha_pago.seconds * 1000 : t.fecha_pago || Date.now());

                const clientObj = clientsMap[t.id_cliente];
                const clientPhone = clientObj?.telefono;
                const whatsappUrl = clientPhone ? generateReceiptWhatsAppLink(clientPhone, {
                  transactionId: t.id,
                  nombreNegocio: t.nombre_negocio,
                  appSuscrita: clientObj?.app_suscrita || 'General',
                  idExterno: clientObj?.id_externo,
                  montoUsd: t.monto_usd_base,
                  tasaBcv: t.tasa_bcv_aplicada,
                  montoVes: t.monto_ves_cobrado,
                  metodoPago: t.metodo_pago,
                  fechaPago: date.toLocaleDateString('es-VE'),
                  mesesPagados: t.meses_pagados || 1,
                  referencia: t.referencia,
                  nota: t.nota
                }) : null;

                return (
                  <div 
                    key={t.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {t.nombre_negocio || 'Comercio'}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{t.metodo_pago || 'Pago Móvil'}</span>
                          {t.meses_pagados > 1 && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                              {t.meses_pagados} meses
                            </span>
                          )}
                          <span>•</span>
                          <span>{date.toLocaleDateString('es-VE')}</span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          +${Number(t.monto_usd_base || 0).toFixed(2)}
                        </span>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {Number(t.monto_ves_cobrado || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                        </div>
                      </div>
                    </div>

                    {/* Referencia o Nota */}
                    {(t.referencia || t.nota) && (
                      <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        {t.referencia && (
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            Ref: <strong>{t.referencia}</strong>
                          </span>
                        )}
                        {t.nota && (
                          <span className="italic text-slate-500 dark:text-slate-400 truncate">
                            {t.nota}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer con Tasa y Botones de Acción */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-400 dark:text-slate-500 text-[10px]">
                        Tasa: {Number(t.tasa_bcv_aplicada || 0).toFixed(2)} Bs/$
                      </span>

                      <div className="flex items-center gap-1">
                        
                        {/* Enviar WhatsApp */}
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Enviar recibo formal por WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Copiar Recibo */}
                        <button
                          type="button"
                          onClick={() => handleCopyReceipt(t)}
                          title="Copiar texto de recibo"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          {copiedId === t.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Editar Cobro */}
                        <button
                          type="button"
                          onClick={() => onEditTransaction && onEditTransaction(t)}
                          title="Editar cobro"
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Eliminar Cobro */}
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction && onDeleteTransaction(t)}
                          title="Eliminar cobro"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer of Drawer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-center">
            <button
              onClick={() => exportTransactionsToCSV(filteredTransactions)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Descargar Reporte en Excel (.CSV)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
