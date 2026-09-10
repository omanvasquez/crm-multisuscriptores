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
import Footer from './components/Footer';

import { 
  subscribeToClients, 
  createClient, 
  updateClient, 
  softDeleteClient, 
  registerClientPayment, 
  subscribeToTransactions 
} from './services/clientService';
import { getBcvRate } from './services/bcvService';
import { exportClientsToCSV } from './utils/exportCsv';

import { 
  Search, 
  Filter, 
  PlusCircle, 
  FileSpreadsheet, 
  RefreshCw, 
  Building2,
  AlertCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function App() {
  const { currentUser, isAdmin, loading: authLoading } = useAuth();

  // State
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bcvData, setBcvData] = useState(null);
  const [loadingClients, setLoadingClients] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, DELINQUENT, SOLVENT

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientForPayment, setClientForPayment] = useState(null);
  const [isBcvModalOpen, setIsBcvModalOpen] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  // Load BCV Rate
  useEffect(() => {
    if (!currentUser) return;
    getBcvRate().then(data => setBcvData(data));
  }, [currentUser]);

  // Subscribe to Clients & Transactions in real-time
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

    return () => {
      unsubClients();
      unsubTransactions();
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

      // Solvency & Trial status
      const estado = c.estado_cliente || (c.estado_pago ? 'SOLVENTE' : 'MOROSO');
      if (statusFilter === 'SOLVENT' && estado !== 'SOLVENTE') return false;
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

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await softDeleteClient(clientToDelete.id);
      setClientToDelete(null);
    } catch (err) {
      console.error('Error in soft delete:', err);
    }
  };

  const handleConfirmPayment = async (paymentData) => {
    await registerClientPayment(paymentData);
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
        onOpenTransactions={() => setIsTransactionsOpen(true)}
        onExportClients={() => exportClientsToCSV(clients, bcvData?.rate)}
        clientsCount={clients.length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        
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

              {/* Status Filter */}
              <div className="inline-flex rounded-xl bg-slate-950/70 p-1 border border-slate-800 text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === 'ALL' 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('SOLVENT')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    statusFilter === 'SOLVENT' 
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold' 
                      : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Solventes
                </button>
                <button
                  onClick={() => setStatusFilter('TRIAL')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    statusFilter === 'TRIAL' 
                      ? 'bg-purple-500/20 text-purple-300 font-semibold' 
                      : 'text-slate-400 hover:text-purple-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  En Prueba
                </button>
                <button
                  onClick={() => setStatusFilter('DELINQUENT')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    statusFilter === 'DELINQUENT' 
                      ? 'bg-rose-500/20 text-rose-300 font-semibold' 
                      : 'text-slate-400 hover:text-rose-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Morosos
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
                onRegisterPayment={(c) => {
                  setClientForPayment(c);
                  setIsPaymentModalOpen(true);
                }}
                onEditClient={(c) => {
                  setClientToEdit(c);
                  setIsClientModalOpen(true);
                }}
                onDeleteClient={(c) => setClientToDelete(c)}
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
        }}
        className="fixed bottom-6 right-6 sm:hidden z-40 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/40 flex items-center justify-center active:scale-95 transition-transform"
        title="Registrar Comercio"
      >
        <PlusCircle className="w-7 h-7" />
      </button>

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
      />

      <BcvModal
        isOpen={isBcvModalOpen}
        onClose={() => setIsBcvModalOpen(false)}
        bcvData={bcvData}
        onRateUpdated={(updated) => setBcvData(updated)}
      />

      <TransactionsDrawer
        isOpen={isTransactionsOpen}
        onClose={() => setIsTransactionsOpen(false)}
        transactions={transactions}
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
