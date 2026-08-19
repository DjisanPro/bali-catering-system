import React, { useState, useEffect, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { BaliLogo } from './BaliLogo';
import {
  Lock,
  Unlock,
  KeyRound,
  X,
  AlertCircle,
  ArrowRight,
  Delete,
  ShieldAlert,
} from 'lucide-react';

export const AdminAuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authenticateAdmin } = useRestaurant();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setPin('');
      setErrorMsg('');
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isAuthModalOpen]);

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
      setErrorMsg('Por favor, introduza o código de acesso.');
      return;
    }

    const success = authenticateAdmin(pin);
    if (success) {
      setIsSuccess(true);
      setErrorMsg('');
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 400);
    } else {
      setErrorMsg('Código de segurança incorreto. Tente novamente.');
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
        <div className="pt-8 pb-6 px-6 bg-gradient-to-b from-orange-50/60 to-white text-center flex flex-col items-center border-b border-slate-100">
          <div className="mb-3">
            <BaliLogo variant="mark" size="md" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-orange-400 text-[11px] font-bold tracking-wide uppercase mb-2">
            <Lock className="w-3 h-3 text-[#F27D26]" />
            <span>Área de Acesso Restrito</span>
          </div>

          <h3 className="font-heading font-extrabold text-xl text-slate-900 tracking-tight">
            Painel de Gestão Interna
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Introduza o código de segurança administrativo para desbloquear o sistema.
          </p>
        </div>

        {/* PIN Input & Keypad */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hidden native input for physical keyboard support */}
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

            {/* Display Visual PIN Indicator */}
            <div
              onClick={() => inputRef.current?.focus()}
              className={`flex justify-center items-center gap-3 py-4 px-6 rounded-2xl bg-slate-50 border-2 transition-all cursor-pointer ${
                errorMsg
                  ? 'border-red-300 bg-red-50/50'
                  : isSuccess
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-200 focus-within:border-orange-500'
              }`}
            >
              {pin.length === 0 ? (
                <span className="text-slate-400 text-sm font-medium tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#F27D26]" />
                  <span>Digite o código de 6 dígitos</span>
                </span>
              ) : (
                <div className="flex gap-2.5 items-center">
                  {Array.from({ length: Math.max(6, pin.length) }).map((_, idx) => {
                    const isFilled = idx < pin.length;
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full transition-all ${
                          isFilled
                            ? isSuccess
                              ? 'bg-emerald-500 scale-110'
                              : 'bg-slate-900 scale-110'
                            : 'bg-slate-200'
                        }`}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error / Success Feedback */}
            {errorMsg && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSuccess && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Acesso Autorizado! A abrir painel...</span>
              </div>
            )}

            {/* Virtual Keypad */}
            <div className="grid grid-cols-3 gap-2.5 pt-1 select-none">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="py-3 rounded-2xl bg-slate-100/80 hover:bg-orange-50 active:bg-orange-100 text-slate-800 hover:text-orange-600 font-heading font-bold text-lg border border-slate-200/60 shadow-2xs hover:border-orange-300 transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}

              {/* Clear button */}
              <button
                type="button"
                onClick={handleClear}
                className="py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs border border-slate-200/60 transition-all cursor-pointer uppercase tracking-wider"
              >
                Limpar
              </button>

              {/* 0 */}
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="py-3 rounded-2xl bg-slate-100/80 hover:bg-orange-50 active:bg-orange-100 text-slate-800 hover:text-orange-600 font-heading font-bold text-lg border border-slate-200/60 shadow-2xs hover:border-orange-300 transition-all cursor-pointer"
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onClick={handleDelete}
                className="py-3 rounded-2xl bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 font-bold text-xs border border-slate-200/60 transition-all flex items-center justify-center cursor-pointer"
                title="Apagar"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={pin.length < 4}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#F27D26] hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-heading font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Desbloquear Painel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Notice Footer */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Código inicial padrão configurável nas definições de sistema.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
