import React from 'react';
import { ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-900/40 py-8 px-4 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-1.5">
          <span>CRM Multi-Suscripciones v1.0</span>
          <span className="text-slate-700">•</span>
          <span>Panel de Gestión Financiera</span>
        </div>

        <div className="flex items-center gap-1">
          <span>Desarrollado con dedicación por</span>
          <a
            href="https://oman-vasquez.web.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-slate-300 hover:text-emerald-400 transition-colors inline-flex items-center gap-1 underline underline-offset-4 decoration-emerald-500/40"
          >
            Oman Vásquez
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </footer>
  );
}
