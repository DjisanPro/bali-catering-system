import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { User, UserRole, UserStatus, PermissionAction } from '../../types';
import { MAX_ACTIVE_SELLERS } from '../../engine';
import { formatDateTime } from '../../utils/formatters';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  PlayCircle,
  Activity,
  UserCheck,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const {
    users,
    currentUser,
    createSeller,
    updateUser,
    deleteUser,
    updateAdminPin,
    showToast,
    auditLogs,
    orders,
  } = useRestaurant();

  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);

  // Form states for new seller
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [passwordOrPin, setPasswordOrPin] = useState('');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [formError, setFormError] = useState('');

  // Form states for Admin PIN change
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinModalError, setPinModalError] = useState('');

  // Simulator state
  const [simulatedRole, setSimulatedRole] = useState<UserRole>('SELLER');
  const [simulationResult, setSimulationResult] = useState<{
    action: string;
    allowed: boolean;
    reason?: string;
    timestamp: string;
  } | null>(null);

  const activeSellersCount = users.filter(
    (u) => u.role === 'SELLER' && u.status === 'ACTIVE'
  ).length;

  const adminUser = users.find((u) => u.role === 'ADMIN');
  const sellerUsers = users.filter((u) => u.role === 'SELLER');

  const handleOpenCreateModal = () => {
    setName('');
    setUsername('');
    setPasswordOrPin('');
    setStatus('ACTIVE');
    setFormError('');
    setIsNewUserModalOpen(true);
  };

  const handleCreateSeller = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const res = createSeller({
      name,
      username,
      passwordOrPin,
      status,
    });

    if (res.success) {
      setIsNewUserModalOpen(false);
      showToast(
        'Vendedor Registado',
        `Operador "${name}" (@${username.toLowerCase()}) adicionado com sucesso.`
      );
    } else {
      setFormError(res.error || 'Não foi possível cadastrar o vendedor.');
    }
  };

  const handleToggleStatus = (user: User) => {
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = updateUser(user.id, { status: nextStatus });
    if (res.success) {
      showToast(
        'Estado Atualizado',
        `Vendedor ${user.name} agora está ${nextStatus === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}.`
      );
    } else {
      showToast('Erro ao Atualizar', res.error, 'error');
    }
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = updateUser(editingUser.id, {
      name: editingUser.name,
      username: editingUser.username,
      status: editingUser.status,
      passwordOrPin: passwordOrPin || undefined,
    });

    if (res.success) {
      setEditingUser(null);
      setPasswordOrPin('');
      showToast('Dados Salvos', `Utilizador ${editingUser.name} atualizado com sucesso.`);
    } else {
      showToast('Falha na Atualização', res.error, 'error');
    }
  };

  const handleDeleteUser = (user: User) => {
    if (
      window.confirm(
        `Tem a certeza de que deseja remover o vendedor "${user.name}" (@${user.username})?`
      )
    ) {
      const res = deleteUser(user.id);
      if (res.success) {
        showToast('Vendedor Removido', `O registo de ${user.name} foi removido com sucesso.`);
      } else {
        showToast('Erro ao Remover', res.error, 'error');
      }
    }
  };

  const handleUpdateAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinModalError('');

    if (newPin !== confirmPin) {
      setPinModalError('A confirmação do novo PIN não coincide.');
      return;
    }

    const res = updateAdminPin(currentPin, newPin);
    if (res.success) {
      setIsAdminPinModalOpen(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      setPinModalError(res.message);
    }
  };

  // Run a real-time RBAC test against the permission engine
  const runPermissionTest = (action: PermissionAction, label: string) => {
    const testUser =
      simulatedRole === 'ADMIN'
        ? adminUser || null
        : sellerUsers.find((u) => u.status === 'ACTIVE') || {
            id: 'SIMULATED-SELLER',
            name: 'Vendedor Simulado',
            username: 'vendedor.teste',
            role: 'SELLER' as UserRole,
            status: 'ACTIVE' as UserStatus,
            passwordHash: '',
            salt: '',
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
          };

    // Use engine directly
    import('../../engine').then(({ userEngine }) => {
      const check = userEngine.canPerformAction(testUser, action);
      setSimulationResult({
        action: label,
        allowed: check.allowed,
        reason: check.reason,
        timestamp: new Date().toLocaleTimeString('pt-PT'),
      });
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quota Information */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-[#F27D26] text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Arquitetura de Segurança & Permissões RBAC</span>
            </div>
            <h2 className="text-2xl font-black font-heading text-slate-900 tracking-tight">
              Gestão de Utilizadores & Vendedores
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              O sistema Bali Catering Service opera com 1 Administrador Principal (Boss) com
              pleno controlo e até 5 Vendedores Ativos com permissões operacionais estritamente
              validadas a nível do motor de dados (Engine).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Active quota indicator */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 flex items-center gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Vendedores Ativos
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span
                    className={`text-2xl font-extrabold font-heading ${
                      activeSellersCount >= MAX_ACTIVE_SELLERS
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {activeSellersCount}
                  </span>
                  <span className="text-slate-400 font-bold text-sm">/ {MAX_ACTIVE_SELLERS} máx.</span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <button
              onClick={handleOpenCreateModal}
              disabled={activeSellersCount >= MAX_ACTIVE_SELLERS}
              className={`px-5 py-3 rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                activeSellersCount >= MAX_ACTIVE_SELLERS
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#F27D26] hover:bg-[#d96716] text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Adicionar Vendedor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Administrator (Boss) Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#F27D26] to-amber-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
              ADM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-heading text-white">
                  {adminUser?.name || 'Administrador Principal (Boss)'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 uppercase tracking-wide flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Pleno Acesso (Boss)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Utilizador: <strong className="text-slate-200 font-mono">@{adminUser?.username || 'admin'}</strong> | ID:{' '}
                <span className="font-mono text-slate-400">{adminUser?.id}</span> | Protegido contra exclusão
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAdminPinModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-orange-400" />
              <span>Alterar PIN / Palavra-passe</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/50 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Autoridade Total</span>
            <span className="text-slate-200 font-semibold">12 Módulos do Sistema</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Ações Sensíveis</span>
            <span className="text-slate-200 font-semibold">Preços, Estoque & Backups</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Última Atividade</span>
            <span className="text-slate-200 font-semibold font-mono">
              {adminUser?.lastActivity ? formatDateTime(adminUser.lastActivity) : 'Em sessão'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Criptografia</span>
            <span className="text-emerald-300 font-semibold">SHA-256 + Salt</span>
          </div>
        </div>
      </div>

      {/* Sellers List Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900">
              Vendedores Registados ({sellerUsers.length})
            </h3>
            <p className="text-xs text-slate-500">
              Vendedores autorizados a operar no PDV, criar pedidos, receber pagamentos e consultar atendimento.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            {activeSellersCount} de {MAX_ACTIVE_SELLERS} slots ativos utilizados
          </div>
        </div>

        {sellerUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-600">Nenhum vendedor registado</p>
            <p className="text-xs text-slate-400 mt-1">
              Clique em "Adicionar Vendedor" para cadastrar o primeiro operador de balcão.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Vendedor / Nome</th>
                  <th className="p-4">Utilizador / ID</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Data de Registo</th>
                  <th className="p-4">Última Atividade</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellerUsers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center font-bold text-[#F27D26]">
                          {seller.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{seller.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">
                            Função: VENDEDOR
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-mono font-bold text-slate-700 text-xs">@{seller.username}</p>
                      <p className="font-mono text-[10px] text-slate-400">{seller.id}</p>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(seller)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                          seller.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Clique para alternar estado"
                      >
                        {seller.status === 'ACTIVE' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>ATIVO</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>INATIVO</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDateTime(seller.createdAt)}
                    </td>

                    <td className="p-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {seller.lastActivity ? formatDateTime(seller.lastActivity) : 'Sem atividade'}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingUser(seller)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar Vendedor & Redefinir Senha"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(seller)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remover Vendedor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive RBAC Security Simulator */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
              <PlayCircle className="w-4 h-4" />
              <span>Simulador & Auditoria de Rejeição no Engine (RBAC)</span>
            </div>
            <h3 className="font-heading font-extrabold text-lg text-white">
              Teste de Proteção e Rejeição no Backend
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Demonstra que as restrições NÃO são apenas visuais: o motor de dados (Engine) valida
              cada ação e rejeita tentativas não autorizadas com log imediato.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setSimulatedRole('SELLER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                simulatedRole === 'SELLER'
                  ? 'bg-[#F27D26] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Testar como VENDEDOR
            </button>
            <button
              onClick={() => setSimulatedRole('ADMIN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                simulatedRole === 'ADMIN'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Testar como ADMIN
            </button>
          </div>
        </div>

        {/* Action Test Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={() =>
              runPermissionTest('CHANGE_PRODUCT_PRICE', 'Alteração Global de Preços')
            }
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer group"
          >
            <p className="font-bold text-xs text-slate-200 group-hover:text-orange-400">
              Alterar Preço de Produto
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Tenta modificar o valor de venda no cardápio
            </p>
          </button>

          <button
            onClick={() => runPermissionTest('DELETE_CUSTOMER', 'Exclusão de Cliente')}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer group"
          >
            <p className="font-bold text-xs text-slate-200 group-hover:text-orange-400">
              Apagar Registo de Cliente
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Tenta apagar cliente da base de CRM
            </p>
          </button>

          <button
            onClick={() =>
              runPermissionTest('MANUAL_STOCK_ADJUSTMENT', 'Ajuste Manual de Estoque')
            }
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer group"
          >
            <p className="font-bold text-xs text-slate-200 group-hover:text-orange-400">
              Ajuste Manual de Estoque
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Tenta alterar saldo físico de ingredientes
            </p>
          </button>

          <button
            onClick={() => runPermissionTest('CREATE_ORDER', 'Criação de Pedido PDV')}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer group"
          >
            <p className="font-bold text-xs text-slate-200 group-hover:text-emerald-400">
              Criar Pedido no Balcão (PDV)
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Operação de venda legítima do vendedor
            </p>
          </button>

          <button
            onClick={() => runPermissionTest('RECEIVE_PAYMENT', 'Receber Pagamento')}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer group"
          >
            <p className="font-bold text-xs text-slate-200 group-hover:text-emerald-400">
              Concluir Recebimento / Venda
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Lançar pagamento M-Pesa / Numerário
            </p>
          </button>

          <button
            onClick={() => runPermissionTest('RESTORE_BACKUP', 'Restauração de Backup')}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer group"
          >
            <p className="font-bold text-xs text-slate-200 group-hover:text-red-400">
              Restaurar Base de Dados
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Operação destrutiva restrita ao Administrador
            </p>
          </button>
        </div>

        {/* Real-time simulation feedback output */}
        {simulationResult && (
          <div
            className={`p-4 rounded-2xl border transition-all ${
              simulationResult.allowed
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/60 border-red-500/40 text-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {simulationResult.allowed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <ShieldX className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">
                    Teste: {simulationResult.action} (Papel:{' '}
                    <span className="underline">{simulatedRole}</span>)
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    {simulationResult.timestamp}
                  </span>
                </div>
                <p className="text-xs mt-1">
                  <strong>Resultado do Engine: </strong>
                  {simulationResult.allowed ? (
                    <span className="text-emerald-300 font-bold">
                      PERMITIDO (Ação operacional válida para a função)
                    </span>
                  ) : (
                    <span className="text-red-300 font-bold">
                      REJEITADO NO ENGINE — {simulationResult.reason}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: New Seller */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <h3 className="font-heading font-extrabold text-xl text-slate-900 mb-1">
              Cadastrar Novo Vendedor
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cada vendedor terá as suas credenciais individuais e acesso restrito ao PDV.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSeller} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo do Vendedor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Mateus"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome de Utilizador (Login)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="carlos.vendedor"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Palavra-passe / PIN de Acesso (Mínimo 4 dígitos)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••"
                  value={passwordOrPin}
                  onChange={(e) => setPasswordOrPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado Inicial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UserStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none"
                >
                  <option value="ACTIVE">Ativo (Pode iniciar sessão imediatamente)</option>
                  <option value="INACTIVE">Inativo (Bloqueado temporariamente)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#F27D26] hover:bg-[#d96716] text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Cadastrar Vendedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User & Reset Password */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <h3 className="font-heading font-extrabold text-xl text-slate-900 mb-1">
              Editar Vendedor: {editingUser.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Atualize as informações ou redefina o PIN/senha de acesso.
            </p>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome de Utilizador
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.username}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      username: e.target.value.toLowerCase().replace(/\s+/g, ''),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Redefinir PIN / Senha (opcional)
                </label>
                <input
                  type="password"
                  placeholder="Deixe em branco para manter a senha atual"
                  value={passwordOrPin}
                  onChange={(e) => setPasswordOrPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
                <select
                  value={editingUser.status}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, status: e.target.value as UserStatus })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none"
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Admin PIN */}
      {isAdminPinModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <h3 className="font-heading font-extrabold text-xl text-slate-900 mb-1">
              Alterar PIN do Administrador
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Atualize o código de segurança do Administrador Principal (Boss).
            </p>

            {pinModalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{pinModalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdminPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN Atual do Administrador
                </label>
                <input
                  type="password"
                  required
                  placeholder="PIN atual (ex: 250420)"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Novo Código PIN (Mínimo 4 dígitos)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Novo PIN de segurança"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirmar Novo PIN
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repita o novo PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdminPinModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Salvar Novo PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
