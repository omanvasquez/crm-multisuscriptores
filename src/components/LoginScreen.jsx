import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  LogIn, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2 
} from 'lucide-react';

export default function LoginScreen() {
  const { 
    loginWithEmail, 
    sendResetPassword, 
    loginWithGoogle, 
    loginWithGoogleRedirect, 
    authError, 
    setAuthError 
  } = useAuth();

  const [email, setEmail] = useState('omanjrvasquez@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showGoogleOptions, setShowGoogleOptions] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setAuthError('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);
    setSuccessMessage(null);
    try {
      await loginWithEmail(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Por favor ingresa tu correo para restablecer o crear tu contraseña.');
      return;
    }

    setIsResetting(true);
    setSuccessMessage(null);
    try {
      const ok = await sendResetPassword(email);
      if (ok) {
        setSuccessMessage(`Se ha enviado un enlace oficial a ${email}. Revisa tu bandeja de entrada o spam para crear o cambiar tu contraseña.`);
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleGooglePopup = async () => {
    setIsLoading(true);
    setSuccessMessage(null);
    try {
      await loginWithGoogle(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRedirect = async () => {
    setIsLoading(true);
    setSuccessMessage(null);
    try {
      await loginWithGoogleRedirect();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-200">
      {/* Background glowing effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 dark:bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center">
        
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/20 text-white font-bold text-2xl">
          MS
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          CRM Multi-Suscripciones
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Control de cobranzas recurrentes y proyecciones a comercios locales.
        </p>

        {/* Error notification */}
        {authError && (
          <div className="mt-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start justify-between gap-2 text-left animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
            <button 
              type="button"
              onClick={() => setAuthError(null)}
              className="text-rose-400 hover:text-rose-600 p-0.5 rounded transition-colors"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success notification */}
        {successMessage && (
          <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start justify-between gap-2 text-left animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
            <button 
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-emerald-700 p-0.5 rounded transition-colors"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="tu-correo@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Contraseña
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResetting || isLoading}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium transition-colors"
              >
                {isResetting ? 'Enviando...' : '¿Olvidaste o quieres crear contraseña?'}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isResetting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        {/* Collapsible Google Auth backup option */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowGoogleOptions(!showGoogleOptions)}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {showGoogleOptions ? 'Ocultar acceso con Google' : '¿Prefieres intentar con Google?'}
          </button>

          {showGoogleOptions && (
            <div className="mt-3 space-y-2 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={handleGooglePopup}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Acceder con Google</span>
              </button>
              <button
                type="button"
                onClick={handleGoogleRedirect}
                disabled={isLoading}
                className="w-full py-2 px-3 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Google pantalla completa (móvil)
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>Acceso exclusivo para el administrador</span>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 z-10">
        <span>Desarrollado por</span>{' '}
        <a
          href="https://oman-vasquez.web.app"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
        >
          Oman Vásquez
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
