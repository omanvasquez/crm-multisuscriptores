import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';
import Navbar from './components/Navbar';
import MetricsCards from './components/MetricsCards';
import ClientCard from './components/ClientCard';
import ClientModal from './components/ClientModal';
import PaymentModal from './components/PaymentModal';
import BcvModal from './components/BcvModal';
import TransactionsDrawer from './components/TransactionsDrawer';
import TransactionEditModal from './components/TransactionEditModal';
import PaymentSettingsModal from './components/PaymentSettingsModal';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';

import { 
  subscribeToClients, 
  createClient, 
  updateClient, 
  softDeleteClient, 
  registerClientPayment, 
  subscribeToTransactions,
  updateTransaction,
  deleteTransaction,
  subscribeToPaymentConfig,
  savePaymentConfig,
  toggleSuspendClient
} from './services/clientService';
import { getBcvRate } from './services/bcvService';
import { exportClientsToCSV, exportFullBackupJSON } from './utils/exportCsv';
import { triggerHaptic } from './utils/haptics';

import { 
  Search, 
  PlusCircle, 
  RefreshCw, 
  Building2, 
  Trash2,
  Clock
} from 'lucide-react';

export default function App() {
  const { currentUser, isAdmin, loading: authLoading } = useAuth();

  // State
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bcvData, setBcvData] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loadingClients, setLoadingClients] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, SOLVENT, UPCOMING, TRIAL, DELINQUENT, SUSPENDED

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientForPayment, setClientForPayment] = useState(null);
  const [isBcvModalOpen, setIsBcvModalOpen] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [clientFilterForTransactions, setClientFilterForTransactions] = useState(null);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  // Load BCV Rate
  useEffect(() => {
    if (!currentUser) return;
    getBcvRate().then(data => setBcvData(data));
  }, [currentUser]);

  // Subscribe to Clients, Transactions & Payment Settings in real-time
  useEffect(() => {
    if (!currentUser) return;

    setLoadingClients(true);
    const unsubClients = subscribeToClients(
      (data) => {
        setClients(data);
        setLoadingClients(false);
      },
      (err) => {
        console.error('Error fetching clients:', err);
        setLoadingClients(false);
      }
    );

    const unsubTransactions = subscribeToTransactions(
      (data) => setTransactions(data),
      (err) => console.error('Error fetching transactions:', err)
    );

    const unsubConfig = subscribeToPaymentConfig(
      (data) => setPaymentConfig(data),
      (err) => console.warn('Payment config fetch:', err)
    );

    return () => {
      unsubClients();
      unsubTransactions();
      unsubConfig();
    };
  }, [currentUser]);

  // Extract unique apps dynamically from clients list (business requirement)
  const dynamicApps = useMemo(() => {
    const appsSet = new Set();
    clients.forEach(c => {
      if (c.app_suscrita && c.app_suscrita.trim()) {
        appsSet.add(c.app_suscrita.trim());
      }
    });
    return Array.from(appsSet);
  }, [clients]);

  // Counts for filters and badges
  const suspendedCount = useMemo(() => {
    return clients.filter(c => c.suspendido).length;
  }, [clients]);

  const delinquentCount = useMemo(() => {
    return clients.filter(c => !c.suspendido && (c.estado_cliente === 'MOROSO' || c.estado_cliente === 'PRUEBA_VENCIDA')).length;
  }, [clients]);

  const upcomingCount = useMemo(() => {
    return clients.filter(c => !c.suspendido && c.estado_cliente === 'POR_VENCER').length;
  }, [clients]);

  // Filter clients based on search query, selected app, and payment status
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      // Search text (supports ID, name, contact, CI, phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.nombre_negocio?.toLowerCase().includes(q);
        const matchEncargado = c.encargado?.toLowerCase().includes(q);
        const matchCedula = c.cedula?.toLowerCase().includes(q);
        const matchTel = c.telefono?.includes(q);
        const matchId = c.id_externo?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q);
        if (!matchName && !matchEncargado && !matchCedula && !matchTel && !matchId) {
          return false;
        }
      }

      // App category
      if (selectedApp !== 'ALL' && c.app_suscrita !== selectedApp) {
        return false;
      }

      // Suspension & Solvency filtering
      const isSuspended = Boolean(c.suspendido);
      if (statusFilter === 'SUSPENDED') {
        return isSuspended;
      }
      
      // If NOT on SUSPENDED tab, hide suspended clients so they do not clutter active lists
      if (isSuspended) {
        return false;
      }

      const estado = c.estado_cliente || (c.estado_pago ? 'SOLVENTE' : 'MOROSO');
      if (statusFilter === 'SOLVENT' && estado !== 'SOLVENTE' && estado !== 'POR_VENCER') return false;
      if (statusFilter === 'UPCOMING' && estado !== 'POR_VENCER') return false;
      if (statusFilter === 'TRIAL' && estado !== 'EN_PRUEBA') return false;
      if (statusFilter === 'DELINQUENT' && estado !== 'MOROSO' && estado !== 'PRUEBA_VENCIDA') return false;

      return true;
    });
  }, [clients, searchQuery, selectedApp, statusFilter]);

  // Client actions
  const handleSaveClient = async (formData, clientId) => {
    if (clientId) {
      await updateClient(clientId, formData);
    } else {
      await createClient(formData);
    }
  };

  const handleToggleSuspend = async (client) => {
    try {
      await toggleSuspendClient(client.id, !client.suspendido);
      triggerHaptic('medium');
    } catch (err) {
      console.error('Error toggling suspension:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await softDeleteClient(clientToDelete.id);
      triggerHaptic('heavy');
      setClientToDelete(null);
    } catch (err) {
      console.error('Error in soft delete:', err);
    }
  };

  const handleConfirmPayment = async (paymentData) => {
    return await registerClientPayment(paymentData);
  };

  // Transaction Edit / Delete
  const handleSaveTransaction = async (txId, updateData) => {
    await updateTransaction(txId, updateData);
  };

  const handleDeleteTransaction = async (txId, clientId) => {
    await deleteTransaction(txId, clientId);
  };

  // View specific client's transactions
  const handleViewClientHistory = (client) => {
    setClientFilterForTransactions(client);
    setIsTransactionsOpen(true);
    triggerHaptic('light');
  };

  // Payment settings & Backup
  const handleSaveConfig = async (newConfig) => {
    await savePaymentConfig(newConfig);
  };

  const handleExportJson = () => {
    exportFullBackupJSON(clients, transactions, paymentConfig);
    triggerHaptic('medium');
  };

  // If checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl border-2 border-emerald-500/30 border-t-emerald-500 animate-spin mb-4"></div>
        <p className="text-sm font-medium">Cargando CRM Multi-Suscripciones...</p>
      </div>
    );
  }

  // If not logged in
  if (!currentUser || !isAdmin) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        bcvData={bcvData}
        onOpenBcvModal={() => setIsBcvModalOpen(true)}
        onOpenNewClientModal={() => {
          setClientToEdit(null);
          setIsClientModalOpen(true);
        }}
        onOpenTransactions={() => {
          setClientFilterForTransactions(null);
          setIsTransactionsOpen(true);
        }}
        onExportClients={() => exportClientsToCSV(clients, bcvData?.rate)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        clientsCount={clients.length}
      />

      {/* Main Content (with bottom padding for mobile BottomNav) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-12">
        
        {/* KPI Summary Cards */}
        <MetricsCards 
          clients={clients}
          bcvRate={bcvData?.rate}
          transactions={transactions}
        />

        {/* Filters and Search Bar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por negocio, ID de app, encargado, cédula o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Dynamic App Filter */}
              <select
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
                className="py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="ALL">Todas las Apps ({clients.length})</option>
                {dynamicApps.map((app) => (
                  <option key={app} value={app}>
                    {app}
                  </option>
                ))}
              </select>

              {/* Status Filter Pills */}
              <div className="inline-flex rounded-xl bg-slate-950/70 p-1 border border-slate-800 text-xs flex-wrap gap-0.5">
                <button
                  onClick={() => { setStatusFilter('ALL'); triggerHaptic('light'); }}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === 'ALL' 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => { setStatusFilter('SOLVENT'); triggerHaptic('light'); }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    statusFilter === 'SOLVENT' 
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold' 
                      : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Solventes
                </button>
                <button
                  onClick={() => { setStatusFilter('UPCOMING'); triggerHaptic('light'); }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    statusFilter === 'UPCOMING' 
                      ? 'bg-amber-500/20 text-amber-300 font-semibold' 
                      : 'text-slate-400 hover:text-amber-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Por Vencer {upcomingCount > 0 ? `(${upcomingCount})` : ''}
                </button>
                <button
                  onClick={() => { setStatusFilter('TRIAL'); triggerHaptic('light'); }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    statusFilter === 'TRIAL' 
                      ? 'bg-purple-500/20 text-purple-300 font-semibold' 
                      : 'text-slate-400 hover:text-purple-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  En Prueba
                </button>
                <button
                  onClick={() => { setStatusFilter('DELINQUENT'); triggerHaptic('light'); }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    statusFilter === 'DELINQUENT' 
                      ? 'bg-rose-500/20 text-rose-300 font-semibold' 
                      : 'text-slate-400 hover:text-rose-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Morosos {delinquentCount > 0 ? `(${delinquentCount})` : ''}
                </button>
                <button
                  onClick={() => { setStatusFilter('SUSPENDED'); triggerHaptic('light'); }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    statusFilter === 'SUSPENDED' 
                      ? 'bg-slate-700 text-slate-100 font-semibold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Suspendidos {suspendedCount > 0 ? `(${suspendedCount})` : ''}
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Clients Grid */}
        {loadingClients ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-emerald-500" />
            <span>Sincronizando comercios con Firestore...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-slate-600 stroke-1 mb-3" />
            <h3 className="text-base font-bold text-white">No se encontraron comercios</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedApp !== 'ALL' || statusFilter !== 'ALL'
                ? 'Prueba ajustando los filtros de búsqueda.'
                : 'Comienza registrando tu primer comercio suscrito a tu software.'}
            </p>
            <button
              onClick={() => {
                setClientToEdit(null);
                setIsClientModalOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Primer Comercio</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                bcvRate={bcvData?.rate}
                paymentConfig={paymentConfig}
                onRegisterPayment={(c) => {
                  setClientForPayment(c);
                  setIsPaymentModalOpen(true);
                }}
                onEditClient={(c) => {
                  setClientToEdit(c);
                  setIsClientModalOpen(true);
                }}
                onDeleteClient={(c) => setClientToDelete(c)}
                onToggleSuspend={handleToggleSuspend}
                onViewClientHistory={handleViewClientHistory}
              />
            ))}
          </div>
        )}

      </main>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => {
          setClientToEdit(null);
          setIsClientModalOpen(true);
          triggerHaptic('light');
        }}
        className="fixed bottom-16 right-5 sm:hidden z-20 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/40 flex items-center justify-center active:scale-95 transition-transform"
        title="Registrar Comercio"
      >
        <PlusCircle className="w-6 h-6" />
      </button>

      {/* Bottom Navigation for Mobile PWA */}
      <BottomNav
        statusFilter={statusFilter}
        onSelectFilter={(f) => setStatusFilter(f)}
        delinquentCount={delinquentCount}
        upcomingCount={upcomingCount}
        onOpenTransactions={() => {
          setClientFilterForTransactions(null);
          setIsTransactionsOpen(true);
        }}
        onOpenBcv={() => setIsBcvModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Modals */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setClientToEdit(null);
        }}
        onSave={handleSaveClient}
        clientToEdit={clientToEdit}
        existingApps={dynamicApps}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setClientForPayment(null);
        }}
        onConfirm={handleConfirmPayment}
        client={clientForPayment}
        bcvRate={bcvData?.rate}
        paymentConfig={paymentConfig}
      />

      <BcvModal
        isOpen={isBcvModalOpen}
        onClose={() => setIsBcvModalOpen(false)}
        bcvData={bcvData}
        onRateUpdated={(updated) => setBcvData(updated)}
      />

      <TransactionsDrawer
        isOpen={isTransactionsOpen}
        onClose={() => {
          setIsTransactionsOpen(false);
          setClientFilterForTransactions(null);
        }}
        transactions={transactions}
        clients={clients}
        clientFilter={clientFilterForTransactions}
        onClearClientFilter={() => setClientFilterForTransactions(null)}
        onEditTransaction={(tx) => setTransactionToEdit(tx)}
        onDeleteTransaction={(tx) => {
          if (window.confirm(`¿Deseas eliminar el cobro de ${tx.nombre_negocio} por $${tx.monto_usd_base}?`)) {
            handleDeleteTransaction(tx.id, tx.id_cliente);
            triggerHaptic('heavy');
          }
        }}
      />

      {/* Transaction Edit Modal */}
      <TransactionEditModal
        isOpen={Boolean(transactionToEdit)}
        onClose={() => setTransactionToEdit(null)}
        transaction={transactionToEdit}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Payment Settings & Backup Modal */}
      <PaymentSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={paymentConfig}
        onSave={handleSaveConfig}
        onExportJson={handleExportJson}
      />

      {/* Soft Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              ¿Desactivar comercio?
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              Se desactivará <strong className="text-slate-200">{clientToDelete.nombre_negocio}</strong> de las vistas activas mediante Soft Delete. Su historial de pagos no se perderá.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-900/30 transition-all"
              >
                Sí, desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <Footer />

    </div>
  );
}
