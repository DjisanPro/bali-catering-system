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
  ShieldCheck,
  Store,
  CheckCircle2,
  Eye,
  EyeOff,
  User as UserIcon,
  Mail,
  Flame,
  Send,
  ArrowLeft,
} from 'lucide-react';

export const AdminAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    users,
    authenticateUser,
    signInWithFirebase,
    sendPasswordReset,
  } = useRestaurant();

  const [authMethod, setAuthMethod] = useState<'firebase' | 'pin'>('firebase');
  const [authRole, setAuthRole] = useState<UserRole>('ADMIN');
  const [username, setUsername] = useState<string>('admin');
  const [email, setEmail] = useState<string>('admin@balicatering.co.mz');
  const [password, setPassword] = useState<string>('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isForgotView, setIsForgotView] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const userInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef<boolean>(false);

  const activeSellers = users.filter((u) => u.role === 'SELLER' && u.status === 'ACTIVE');

  // Reset fields when opened
  useEffect(() => {
    if (isAuthModalOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setPin('');
      setPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setIsSuccess(false);
      setIsForgotView(false);
      if (authRole === 'ADMIN') {
        setUsername('admin');
        setEmail('admin@balicatering.co.mz');
      } else if (activeSellers.length > 0) {
        setUsername(activeSellers[0].username);
        setEmail(`${activeSellers[0].username}@balicatering.co.mz`);
      }
      setTimeout(() => {
        if (authMethod === 'firebase') {
          emailInputRef.current?.focus();
        } else {
          pinInputRef.current?.focus();
        }
      }, 100);
    } else if (!isAuthModalOpen) {
      wasOpenRef.current = false;
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setAuthRole(newRole);
    setErrorMsg('');
    if (newRole === 'ADMIN') {
      setUsername('admin');
      setEmail('admin@balicatering.co.mz');
    } else if (activeSellers.length > 0) {
      setUsername(activeSellers[0].username);
      setEmail(`${activeSellers[0].username}@balicatering.co.mz`);
    } else {
      setUsername('');
      setEmail('');
    }
  };

  const handleFirebaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      setErrorMsg('Por favor, informe o endereço de e-mail corporativo.');
      emailInputRef.current?.focus();
      return;
    }

    if (!cleanPass) {
      setErrorMsg('Por favor, introduza a palavra-passe.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await signInWithFirebase(cleanEmail, cleanPass);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setIsLoading(false);
        }, 400);
      } else {
        setIsLoading(false);
        setErrorMsg(res.error || 'Credenciais inválidas. Verifique o email e senha.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Erro ao comunicar com o Firebase Auth.');
    }
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = username.trim();
    const cleanPin = pin.trim();

    if (!cleanUser) {
      setErrorMsg('Por favor, informe o nome de utilizador.');
      userInputRef.current?.focus();
      return;
    }

    if (!cleanPin) {
      setErrorMsg('Por favor, introduza o PIN ou palavra-passe.');
      pinInputRef.current?.focus();
      return;
    }

    const result = authenticateUser(cleanUser, cleanPin);
    if (result.success) {
      setIsSuccess(true);
      setErrorMsg('');
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 300);
    } else {
      setErrorMsg(result.error || 'Credenciais inválidas. Verifique o utilizador e PIN.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      pinInputRef.current?.focus();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg('Por favor, insira o seu e-mail para recuperação.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await sendPasswordReset(forgotEmail.trim());
    setIsLoading(false);
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleKeypadPress = (digit: string) => {
    setPin((prev) => prev + digit);
    setErrorMsg('');
    pinInputRef.current?.focus();
  };

  const handleKeypadDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
    pinInputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/90 overflow-hidden relative transition-all duration-200 ${
          isShaking ? 'animate-bounce text-red-500' : ''
        }`}
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="pt-7 pb-4 px-6 bg-gradient-to-b from-orange-50/70 to-white text-center flex flex-col items-center border-b border-slate-100">
          <div className="mb-2">
            <BaliLogo variant="mark" size="md" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-orange-400 text-[11px] font-bold tracking-wide uppercase mb-2">
            <Flame className="w-3 h-3 text-[#F27D26]" />
            <span>Bali Catering Cloud Security</span>
          </div>

          <h3 className="font-heading font-extrabold text-xl text-slate-900 tracking-tight">
            {isForgotView ? 'Recuperação de Palavra-passe' : 'Autenticação Bali Catering'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            {isForgotView
              ? 'Receberá instruções no seu e-mail para redefinir o acesso com segurança.'
              : 'Firebase Auth & Controlo de Acesso Baseado em Funções (RBAC).'}
          </p>

          {/* Abas Método de Login */}
          {!isForgotView && (
            <div className="mt-4 p-1 rounded-2xl bg-slate-100 flex items-center w-full max-w-xs border border-slate-200/70">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('firebase');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethod === 'firebase'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Firebase Auth</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('pin');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethod === 'pin'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-[#F27D26]" />
                <span>PIN Rápido</span>
              </button>
            </div>
          )}
        </div>

        {/* View: Recuperar Senha */}
        {isForgotView ? (
          <form onSubmit={handleForgotPassword} className="p-6 space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                E-mail da Conta Registada
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="exemplo@balicatering.co.mz"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 py-2 px-3 rounded-xl border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-orange-400" />
                <span>{isLoading ? 'A enviar instruções...' : 'Enviar Link de Redefinição'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotView(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Login</span>
              </button>
            </div>
          </form>
        ) : authMethod === 'firebase' ? (
          /* Formulário Firebase Auth */
          <form onSubmit={handleFirebaseSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                E-mail Corporativo (Firebase Auth)
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  ref={emailInputRef}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="ex: admin@balicatering.co.mz"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Palavra-passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotView(true);
                    setForgotEmail(email);
                    setErrorMsg('');
                  }}
                  className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                >
                  Esqueceu a palavra-passe?
                </button>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4 text-[#F27D26]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Introduza a sua palavra-passe"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all tracking-wider"
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

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 py-2 px-3 rounded-xl border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSuccess && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Autenticação Firebase realizada com sucesso. A entrar...</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Unlock className="w-4 h-4 text-[#F27D26]" />
                <span>{isLoading ? 'A autenticar no Firebase...' : 'Entrar com Firebase Auth'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Formulário PIN Rápido */
          <form onSubmit={handlePinSubmit} className="p-6 space-y-4">
            {/* Campo Usuário */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Utilizador / Login
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  ref={userInputRef}
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder={authRole === 'ADMIN' ? 'admin' : 'Nome de utilizador'}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Campo PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  PIN ou Palavra-passe
                </label>
                <span className="text-[10px] text-slate-400">
                  {authRole === 'ADMIN' ? 'Padrão: 250420' : 'Padrão: 1234'}
                </span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <KeyRound className="w-4 h-4 text-[#F27D26]" />
                </div>
                <input
                  ref={pinInputRef}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setErrorMsg('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePinSubmit();
                    }
                  }}
                  placeholder="Digite o PIN"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all tracking-wider"
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

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 py-2 px-3 rounded-xl border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSuccess && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Sessão desbloqueada com sucesso. Entrando...</span>
              </div>
            )}

            {/* Teclado Numérico */}
            <div className="pt-1">
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
                    pinInputRef.current?.focus();
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
                  aria-label="Apagar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4 text-[#F27D26]" />
                <span>Entrar com PIN Local</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
