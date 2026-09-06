import React, { useState, useEffect, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { ShieldAlert, Lock, KeyRound, X, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const AuthorizedActionModal: React.FC = () => {
  const {
    isAuthorizedModalOpen,
    setIsAuthorizedModalOpen,
    authorizedActionPayload,
    verifyAdminElevation,
  } = useRestaurant();

  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef<boolean>(false);

  useEffect(() => {
    if (isAuthorizedModalOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setPin('');
      setErrorMsg('');
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else if (!isAuthorizedModalOpen) {
      wasOpenRef.current = false;
    }
  }, [isAuthorizedModalOpen]);

  if (!isAuthorizedModalOpen || !authorizedActionPayload) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPin = pin.trim();

    if (!cleanPin) {
      setErrorMsg('Introduza o PIN ou palavra-passe do Administrador.');
      inputRef.current?.focus();
      return;
    }

    const authorized = verifyAdminElevation(cleanPin);
    if (authorized) {
      setIsSuccess(true);
      setErrorMsg('');
      setTimeout(() => {
        if (authorizedActionPayload.onAuthorized) {
          authorizedActionPayload.onAuthorized();
        }
        setIsAuthorizedModalOpen(false);
      }, 300);
    } else {
      setErrorMsg('Credencial de Administrador incorreta.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      inputRef.current?.focus();
    }
  };

  const handleKeypadPress = (digit: string) => {
    setPin((prev) => prev + digit);
    setErrorMsg('');
    inputRef.current?.focus();
  };

  const handleKeypadDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative transition-all duration-200 ${
          isShaking ? 'animate-bounce text-red-500' : ''
        }`}
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={() => setIsAuthorizedModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-10"
          aria-label="Cancelar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="pt-7 pb-5 px-6 bg-gradient-to-b from-amber-50/70 to-white text-center flex flex-col items-center border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 mb-3 shadow-xs">
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

        {/* Formulário com entrada direta e foco garantido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                PIN ou Palavra-passe do Administrador
              </label>
              <span className="text-[10px] text-slate-400">Padrão: 250420</span>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                <KeyRound className="w-4 h-4 text-amber-500" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                placeholder="Digite o PIN de autorização"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all tracking-wider"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 py-2 px-3 rounded-xl border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mensagem de Sucesso */}
          {isSuccess && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Ação autorizada com sucesso. Executando...</span>
            </div>
          )}

          {/* Teclado Numérico de Apoio */}
          <div className="pt-1">
            <p className="text-[10px] text-center font-medium text-slate-400 mb-2 uppercase tracking-wider">
              Teclado de toque rápido
            </p>
            <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-base transition-colors flex items-center justify-center cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setPin('');
                  setErrorMsg('');
                  inputRef.current?.focus();
                }}
                className="h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 text-[11px] font-bold uppercase transition-colors flex items-center justify-center cursor-pointer select-none"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-base transition-colors flex items-center justify-center cursor-pointer select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadDelete}
                className="h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer select-none"
                aria-label="Apagar dígito"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAuthorizedModalOpen(false)}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Autorizar Operação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
