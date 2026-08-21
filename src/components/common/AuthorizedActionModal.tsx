import React, { useState, useEffect, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { ShieldAlert, Lock, KeyRound, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AuthorizedActionModal: React.FC = () => {
  const {
    isAuthorizedModalOpen,
    setIsAuthorizedModalOpen,
    authorizedActionPayload,
    verifyAdminElevation,
  } = useRestaurant();

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthorizedModalOpen) {
      setPin('');
      setErrorMsg('');
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isAuthorizedModalOpen]);

  if (!isAuthorizedModalOpen || !authorizedActionPayload) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 8) {
      setPin((prev) => prev + num);
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
      setErrorMsg('Introduza o PIN ou palavra-passe do Administrador.');
      return;
    }

    const authorized = verifyAdminElevation(pin);
    if (authorized) {
      setIsSuccess(true);
      setErrorMsg('');
      setTimeout(() => {
        if (authorizedActionPayload.onAuthorized) {
          authorizedActionPayload.onAuthorized();
        }
        setIsAuthorizedModalOpen(false);
      }, 400);
    } else {
      setErrorMsg('Credencial de Administrador incorreta.');
      setIsShaking(true);
      setPin('');
      setTimeout(() => setIsShaking(false), 500);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative transition-all duration-300 ${
          isShaking ? 'animate-bounce text-red-500' : ''
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsAuthorizedModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-10"
          aria-label="Cancelar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pt-8 pb-6 px-6 bg-gradient-to-b from-amber-50/70 to-white text-center flex flex-col items-center border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 mb-3 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-amber-400 text-[11px] font-bold tracking-wide uppercase mb-2">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Ação Protegida por Autorização</span>
          </div>

          <h3 className="font-heading font-extrabold text-xl text-slate-900 tracking-tight">
            {authorizedActionPayload.title || 'Autorização Administrativa Necessária'}
          </h3>
          <p className="text-xs text-slate-600 max-w-xs mt-1.5 leading-relaxed">
            {authorizedActionPayload.description ||
              'Esta operação sensível exige validação prévia com o PIN/Palavra-passe do Administrador.'}
          </p>
        </div>

        {/* PIN Input & Keypad */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                if (e.key === 'Enter') handleSubmit();
              }}
              className="sr-only"
              autoFocus
            />

            {/* Display PIN Indicator */}
            <div
              onClick={() => inputRef.current?.focus()}
              className={`flex justify-center items-center gap-3 py-4 px-6 rounded-2xl bg-slate-50 border-2 transition-all cursor-pointer ${
                errorMsg
                  ? 'border-red-300 bg-red-50/50'
                  : isSuccess
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-200 focus-within:border-amber-500'
              }`}
            >
              {pin.length === 0 ? (
                <span className="text-slate-400 text-sm font-medium tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>Introduza o PIN do Admin</span>
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
                              ? 'bg-emerald-500 scale-110 ring-2 ring-emerald-200'
                              : 'bg-slate-900 scale-105'
                            : 'bg-slate-200'
                        }`}
                      />
                    );
                  })}
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
                <span>Ação autorizada com sucesso! A executar...</span>
              </div>
            )}
          </form>

          {/* Numeric Keypad Grid */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-lg transition-colors flex items-center justify-center shadow-2xs cursor-pointer select-none"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors flex items-center justify-center cursor-pointer select-none uppercase tracking-wider"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-lg transition-colors flex items-center justify-center shadow-2xs cursor-pointer select-none"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer select-none"
              aria-label="Apagar dígito"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAuthorizedModalOpen(false)}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Autorizar Operação</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
