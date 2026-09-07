import React, { useState, useEffect, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { BaliLogo } from './BaliLogo';
import { UserRole } from '../../types';
import {
  Lock,
  Unlock,
  X,
  AlertCircle,
  ShieldCheck,
  Store,
  User,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AdminAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authenticateUser,
  } = useRestaurant();

  const [authRole, setAuthRole] = useState<UserRole>('ADMIN');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const identifierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setIdentifier('');
      setPassword('');
      setErrorMsg('');
      setIsSubmitting(false);
      setIsSuccess(false);
      setTimeout(() => identifierRef.current?.focus(), 150);
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!identifier.trim()) {
      setErrorMsg('Introduza o nome de utilizador.');
      return;
    }
    if (!password) {
      setErrorMsg('Introduza a palavra-passe.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result = await authenticateUser(identifier.trim(), password);
      if (result.success) {
        setIsSuccess(true);
        setErrorMsg('');
        setTimeout(() => {
          setIsAuthModalOpen(false);
        }, 350);
      } else {
        setErrorMsg(result.error || 'Credenciais inválidas. Tente novamente.');
        setPassword('');
        identifierRef.current?.focus();
      }
    } catch (err) {
      setErrorMsg('Erro ao autenticar. Verifique a ligação ao servidor.');
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Autenticação">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden relative transition-all duration-300">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header with Brand */}
        <div className="pt-8 pb-5 px-6 bg-gradient-to-b from-orange-50/60 to-white text-center flex flex-col items-center border-b border-slate-100">
          <div className="mb-3">
            <BaliLogo variant="mark" size="md" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-orange-400 text-[11px] font-bold tracking-wide uppercase mb-2">
            <Lock className="w-3 h-3 text-[#E86319]" />
            <span>Área de Acesso Seguro</span>
          </div>

          <h3 className="font-heading font-extrabold text-xl text-slate-900 tracking-tight">
            Entrar no Bali Catering
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Aceda ao sistema com as suas credenciais pessoais.
          </p>

          {/* Role Switcher Tabs */}
          <div className="mt-4 p-1 rounded-2xl bg-slate-100 flex items-center w-full max-w-xs border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setAuthRole('ADMIN');
                setIdentifier('');
                setPassword('');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authRole === 'ADMIN'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#E86319]" />
              <span>Administrador</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthRole('SELLER');
                setIdentifier('');
                setPassword('');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authRole === 'SELLER'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>Vendedor (PDV)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Nome de utilizador
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={identifierRef}
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder={authRole === 'ADMIN' ? 'Seu utilizador administrador' : 'Seu utilizador de vendedor'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Palavra-passe
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-red-600 bg-red-50 py-2 px-3 rounded-xl border border-red-100 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSuccess && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200 animate-fadeIn">
                <span>Autenticação autorizada! A carregar...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unlock className="w-4 h-4 text-[#E86319]" />
              )}
              <span>
                {isSubmitting
                  ? 'A autenticar...'
                  : authRole === 'ADMIN'
                  ? 'Entrar como Administrador'
                  : 'Entrar no Ponto de Venda'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};