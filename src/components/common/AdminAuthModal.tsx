import React, { useState, useEffect, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { BaliLogo } from './BaliLogo';
import { UserRole } from '../../types';
import {
  Lock,
  Unlock,
  KeyRound,
  X,
  AlertCircle,
  ShieldAlert,
  User,
  ShieldCheck,
  Store,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

export const AdminAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    users,
    authenticateUser,
  } = useRestaurant();

  const [authRole, setAuthRole] = useState<UserRole>('ADMIN');
  const [selectedSellerUsername, setSelectedSellerUsername] = useState<string>('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSellers = users.filter((u) => u.role === 'SELLER' && u.status === 'ACTIVE');

  useEffect(() => {
    if (isAuthModalOpen) {
      setPin('');
      setErrorMsg('');
      setIsSuccess(false);
      if (authRole === 'SELLER' && activeSellers.length > 0 && !selectedSellerUsername) {
        setSelectedSellerUsername(activeSellers[0].username);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isAuthModalOpen, authRole]);

  if (!isAuthModalOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 8) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setErrorMsg('Por favor, introduza o PIN ou palavra-passe.');
      return;
    }

    const identifier = authRole === 'ADMIN' ? 'admin' : selectedSellerUsername;
    if (!identifier) {
      setErrorMsg('Selecione ou introduza o utilizador.');
      return;
    }

    const result = authenticateUser(identifier, pin);
    if (result.success) {
      setIsSuccess(true);
      setErrorMsg('');
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 400);
    } else {
      setErrorMsg(result.error || 'Credenciais inválidas. Tente novamente.');
      setIsShaking(true);
      setPin('');
      setTimeout(() => setIsShaking(false), 500);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden relative transition-all duration-300 ${
          isShaking ? 'animate-bounce text-red-500' : ''
        }`}
      >
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
            <Lock className="w-3 h-3 text-[#F27D26]" />
            <span>Área de Acesso Seguro</span>
          </div>

          <h3 className="font-heading font-extrabold text-xl text-slate-900 tracking-tight">
            Autenticação Bali Catering
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Selecione o perfil e introduza as suas credenciais para aceder ao sistema.
          </p>

          {/* Role Switcher Tabs */}
          <div className="mt-4 p-1 rounded-2xl bg-slate-100 flex items-center w-full max-w-xs border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setAuthRole('ADMIN');
                setPin('');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authRole === 'ADMIN'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>Administrador</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthRole('SELLER');
                setPin('');
                setErrorMsg('');
                if (activeSellers.length > 0 && !selectedSellerUsername) {
                  setSelectedSellerUsername(activeSellers[0].username);
                }
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
          {/* Seller Selection Dropdown if Vendedor tab is selected */}
          {authRole === 'SELLER' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Selecione o Vendedor
              </label>
              {activeSellers.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedSellerUsername}
                    onChange={(e) => {
                      setSelectedSellerUsername(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none cursor-pointer"
                  >
                    {activeSellers.map((seller) => (
                      <option key={seller.id} value={seller.username}>
                        {seller.name} (@{seller.username})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  Nenhum vendedor ativo registado. Inicie sessão como Administrador para cadastrar vendedores.
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hidden native input for physical keyboard typing */}
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setPin(val);
                setErrorMsg('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              className="sr-only"
              autoFocus
            />

            {/* Display PIN indicator */}
            <div
              onClick={() => inputRef.current?.focus()}
              className={`flex justify-center items-center gap-3 py-3.5 px-6 rounded-2xl bg-slate-50 border-2 transition-all cursor-pointer ${
                errorMsg
                  ? 'border-red-300 bg-red-50/50'
                  : isSuccess
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-200 focus-within:border-orange-500'
              }`}
            >
              {pin.length === 0 ? (
                <span className="text-slate-400 text-xs font-medium tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#F27D26]" />
                  <span>
                    {authRole === 'ADMIN'
                      ? 'PIN do Administrador (Padrão: 250420)'
                      : 'PIN do Vendedor (Padrão: 1234)'}
                  </span>
                </span>
              ) : (
                <div className="flex gap-2.5 items-center">
                  {Array.from({ length: Math.max(authRole === 'ADMIN' ? 6 : 4, pin.length) }).map(
                    (_, idx) => {
                      const isFilled = idx < pin.length;
                      return (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-full transition-all ${
                            isFilled
                              ? isSuccess
                                ? 'bg-emerald-500 scale-110'
                                : 'bg-slate-900 scale-105'
                              : 'bg-slate-200'
                          }`}
                        />
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-red-600 bg-red-50 py-2 px-3 rounded-xl border border-red-100 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSuccess && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Autenticação autorizada! A carregar...</span>
              </div>
            )}
          </form>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-lg transition-colors flex items-center justify-center shadow-2xs cursor-pointer select-none"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors flex items-center justify-center cursor-pointer select-none uppercase tracking-wider"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-lg transition-colors flex items-center justify-center shadow-2xs cursor-pointer select-none"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="h-11 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer select-none"
              aria-label="Apagar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4 text-[#F27D26]" />
              <span>
                {authRole === 'ADMIN' ? 'Entrar como Administrador' : 'Entrar no Ponto de Venda'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
