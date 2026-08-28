import { User, UserRole, UserStatus, UserSession, PermissionAction, EngineResult, AuditLog } from '../types';
import { securityEngine } from './securityEngine';

export const MAX_ACTIVE_SELLERS = 5;

// Build initial salted hashed credentials
// PIN is read from env (Vite exposes VITE_ prefixed vars to client)
const adminPin = (import.meta && import.meta.env && import.meta.env.VITE_ADMIN_PIN) || '250420';
const adminSalt = (import.meta && import.meta.env && import.meta.env.VITE_ADMIN_SALT) || 'bali_adm_s4lt_99';
const adminHash = securityEngine.hashWithSalt(adminPin, adminSalt);

const seller1Salt = (import.meta && import.meta.env && import.meta.env.VITE_SELLER1_SALT) || 'bali_sel_s4lt_01';
const seller1Hash = securityEngine.hashWithSalt('1234', seller1Salt);

const seller2Salt = (import.meta && import.meta.env && import.meta.env.VITE_SELLER2_SALT) || 'bali_sel_s4lt_02';
const seller2Hash = securityEngine.hashWithSalt('1234', seller2Salt);

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-ADMIN-01',
    name: 'Administrador Principal (Boss)',
    username: 'admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    salt: adminSalt,
    passwordHash: adminHash,
    createdAt: '2025-01-01T08:00:00.000Z',
    lastActivity: new Date().toISOString(),
    failedLoginAttempts: 0,
  },
  {
    id: 'USR-VEND-01',
    name: 'Carlos Mateus (Balcão)',
    username: 'carlos.vendedor',
    role: 'SELLER',
    status: 'ACTIVE',
    salt: seller1Salt,
    passwordHash: seller1Hash,
    createdAt: '2025-01-15T09:30:00.000Z',
    lastActivity: new Date().toISOString(),
    failedLoginAttempts: 0,
    createdById: 'USR-ADMIN-01',
  },
  {
    id: 'USR-VEND-02',
    name: 'Joana Chimoio (Atendimento)',
    username: 'joana.vendedora',
    role: 'SELLER',
    status: 'ACTIVE',
    salt: seller2Salt,
    passwordHash: seller2Hash,
    createdAt: '2025-02-01T10:15:00.000Z',
    lastActivity: new Date().toISOString(),
    failedLoginAttempts: 0,
    createdById: 'USR-ADMIN-01',
  },
];

export const userEngine = {
  // Return initial base users
  getInitialUsers(): User[] {
    return INITIAL_USERS;
  },

  // Count active sellers
  getActiveSellersCount(users: User[]): number {
    return users.filter((u) => u.role === 'SELLER' && u.status === 'ACTIVE').length;
  },

  // Check if a seller can be created or activated without exceeding MAX_ACTIVE_SELLERS
  canCreateOrActivateSeller(
    users: User[],
    targetUserId?: string
  ): { allowed: boolean; reason?: string; activeCount: number } {
    const currentActiveSellers = users.filter(
      (u) => u.role === 'SELLER' && u.status === 'ACTIVE' && u.id !== targetUserId
    );
    const activeCount = currentActiveSellers.length;

    if (activeCount >= MAX_ACTIVE_SELLERS) {
      return {
        allowed: false,
        reason: `Limite de Vendedores Atingido: O sistema Bali Catering Service permite no máximo ${MAX_ACTIVE_SELLERS} vendedores ativos em simultâneo. Desative um vendedor existente antes de adicionar ou ativar outro.`,
        activeCount,
      };
    }

    return {
      allowed: true,
      activeCount,
    };
  },

  // Authenticate user by username and password/PIN
  authenticate(
    identifier: string,
    secret: string,
    users: User[]
  ): { success: boolean; user?: User; error?: string } {
    if (!identifier || !secret) {
      return { success: false, error: 'Introduza o utilizador e a palavra-passe/PIN.' };
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanSecret = secret.trim();

    // Match by username or id
    const user = users.find(
      (u) => u.username.toLowerCase() === cleanIdentifier || u.id.toLowerCase() === cleanIdentifier
    );

    if (!user) {
      return { success: false, error: 'Credenciais inválidas. Utilizador não encontrado.' };
    }

    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'Esta conta de utilizador está atualmente INATIVA. Contacte o Administrador.',
      };
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
      );
      return {
        success: false,
        error: `Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em ${remainingMinutes} min.`,
      };
    }

    // Verify salted cryptographic hash
    const isValid = securityEngine.verifyHash(cleanSecret, user.salt, user.passwordHash);

    if (isValid) {
      return {
        success: true,
        user: {
          ...user,
          lastActivity: new Date().toISOString(),
          failedLoginAttempts: 0,
        },
      };
    } else {
      return {
        success: false,
        error: 'Palavra-passe ou PIN de acesso incorreto.',
      };
    }
  },

  // Create session object
  createSession(user: User, durationHours = 8): UserSession {
    const now = new Date();
    const expires = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    return {
      sessionId: `sess-${user.role.toLowerCase()}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}`,
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      status: user.status,
      loginTime: now.toISOString(),
      lastActivityTime: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
  },

  // Check whether a session is valid and not expired
  isSessionValid(session: UserSession | null, timeoutMinutes = 60): boolean {
    if (!session) return false;
    const now = Date.now();
    const lastActivity = new Date(session.lastActivityTime).getTime();
    const expiresAt = new Date(session.expiresAt).getTime();

    if (now > expiresAt) return false;
    if (now - lastActivity > timeoutMinutes * 60 * 1000) return false;

    return true;
  },

  // RBAC Permission Engine: Determine whether a user role can perform a specific operation
  canPerformAction(
    user: User | null,
    action: PermissionAction
  ): { allowed: boolean; reason?: string } {
    if (!user) {
      return {
        allowed: false,
        reason: 'Sessão não autenticada. É necessário iniciar sessão.',
      };
    }

    if (user.status !== 'ACTIVE') {
      return {
        allowed: false,
        reason: 'Utilizador inativo no sistema.',
      };
    }

    // ADMIN has full authority over all modules and actions
    if (user.role === 'ADMIN') {
      return { allowed: true };
    }

    // SELLER specific permission whitelist
    const sellerAllowedActions: PermissionAction[] = [
      'VIEW_POS',
      'CREATE_ORDER',
      'SEARCH_PRODUCT',
      'ADD_PRODUCT',
      'UPDATE_ORDER_QUANTITY',
      'RECEIVE_PAYMENT',
      'SELECT_PAYMENT_METHOD',
      'COMPLETE_SALE',
      'VIEW_ORDERS_FOR_SERVICE',
      'VIEW_CUSTOMER_MINIMAL',
      'CLOSE_SESSION',
    ];

    if (sellerAllowedActions.includes(action)) {
      return { allowed: true };
    }

    // Specific forbidden descriptions for clarity in audit and toasts
    const forbiddenDescriptions: Record<string, string> = {
      CHANGE_PRODUCT_PRICE: 'Vendedores não possuem permissão para alterar preços globais de produtos.',
      CREATE_PRODUCT: 'Vendedores não possuem permissão para cadastrar novos produtos no cardápio.',
      UPDATE_PRODUCT: 'Vendedores não possuem permissão para editar produtos ou categorias.',
      DELETE_PRODUCT: 'Vendedores não possuem permissão para apagar produtos do cardápio.',
      UPDATE_RECIPE: 'Vendedores não possuem permissão para alterar receitas ou fichas técnicas.',
      CREATE_INGREDIENT: 'Vendedores não possuem permissão para criar ingredientes.',
      UPDATE_INGREDIENT: 'Vendedores não possuem permissão para editar insumos ou fornecedores.',
      DELETE_INGREDIENT: 'Vendedores não possuem permissão para apagar ingredientes.',
      MANUAL_STOCK_ADJUSTMENT: 'Vendedores não possuem permissão para realizar ajustes manuais de estoque.',
      DELETE_ORDER: 'Vendedores não possuem permissão para apagar pedidos do histórico.',
      CANCEL_COMPLETED_SALE: 'O cancelamento de uma venda concluída exige autorização administrativa.',
      VIEW_FULL_FINANCIALS: 'Acesso a relatórios financeiros completos é restrito ao Administrador.',
      DELETE_PAYMENT: 'Vendedores não possuem permissão para apagar registos financeiros ou de caixa.',
      CREATE_CUSTOMER: 'Vendedores apenas podem registar novos clientes através do fluxo do PDV.',
      UPDATE_CUSTOMER: 'Vendedores não possuem permissão para editar a ficha completa de clientes.',
      DELETE_CUSTOMER: 'Vendedores não possuem permissão para apagar clientes da base de dados.',
      VIEW_AUDIT_LOGS: 'A consulta de logs de auditoria e segurança é restrita à Administração.',
      MANAGE_USERS: 'Vendedores não possuem permissão para aceder à gestão de utilizadores.',
      CREATE_USER: 'Vendedores não possuem permissão para criar novos utilizadores.',
      UPDATE_USER: 'Vendedores não possuem permissão para editar utilizadores ou credenciais.',
      DELETE_USER: 'Vendedores não possuem permissão para remover utilizadores.',
      UPDATE_CONFIG: 'Vendedores não possuem permissão para alterar as configurações do restaurante.',
      CREATE_BACKUP: 'A geração de cópias de segurança é restrita à Administração.',
      RESTORE_BACKUP: 'A restauração de cópias de segurança é restrita à Administração.',
      RESET_DATA: 'A reposição de dados de fábrica é restrita à Administração.',
      VIEW_DASHBOARD: 'Acesso ao Dashboard analítico completo é restrito à Administração.',
    };

    return {
      allowed: false,
      reason:
        forbiddenDescriptions[action] ||
        'Acesso Negado: A sua função de Vendedor não possui permissão para realizar esta operação.',
    };
  },

  // Create a new seller user (Admin only, MAX 5 active sellers enforced)
  createSeller(
    adminUser: User | null,
    sellerData: {
      name: string;
      username: string;
      passwordOrPin: string;
      status?: UserStatus;
    },
    currentUsers: User[]
  ): EngineResult<User> {
    // 1. Check admin permission
    const authCheck = this.canPerformAction(adminUser, 'CREATE_USER');
    if (!authCheck.allowed) {
      return {
        success: false,
        error: authCheck.reason || 'Apenas o Administrador pode criar utilizadores.',
      };
    }

    // 2. Validate inputs
    const cleanName = securityEngine.sanitizeInput(sellerData.name);
    const cleanUsername = securityEngine.sanitizeInput(sellerData.username).toLowerCase().replace(/\s+/g, '');
    const cleanPass = sellerData.passwordOrPin?.trim();
    const status: UserStatus = sellerData.status || 'ACTIVE';

    if (!cleanName || cleanName.length < 3) {
      return { success: false, error: 'O nome do vendedor deve ter pelo menos 3 caracteres.' };
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'O nome de utilizador deve ter pelo menos 3 caracteres sem espaços.' };
    }

    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, error: 'A palavra-passe/PIN deve ter no mínimo 4 caracteres ou dígitos.' };
    }

    // 3. Duplicate username check
    const existingUser = currentUsers.find((u) => u.username.toLowerCase() === cleanUsername);
    if (existingUser) {
      return {
        success: false,
        error: `O nome de utilizador "${cleanUsername}" já está em uso por outro operador.`,
      };
    }

    // 4. Enforce MAX 5 active sellers limit
    if (status === 'ACTIVE') {
      const limitCheck = this.canCreateOrActivateSeller(currentUsers);
      if (!limitCheck.allowed) {
        return {
          success: false,
          error: limitCheck.reason,
        };
      }
    }

    // 5. Generate secure salt and cryptographic hash
    const salt = securityEngine.generateSalt(16);
    const passwordHash = securityEngine.hashWithSalt(cleanPass, salt);

    const newSeller: User = {
      id: `USR-VEND-${String(currentUsers.filter((u) => u.role === 'SELLER').length + 1).padStart(2, '0')}`,
      name: cleanName,
      username: cleanUsername,
      role: 'SELLER',
      status,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      createdById: adminUser?.id,
      failedLoginAttempts: 0,
    };

    return {
      success: true,
      data: newSeller,
    };
  },

  // Update an existing user
  updateUser(
    adminUser: User | null,
    targetUserId: string,
    updates: {
      name?: string;
      username?: string;
      status?: UserStatus;
      passwordOrPin?: string;
    },
    currentUsers: User[]
  ): EngineResult<User[]> {
    const authCheck = this.canPerformAction(adminUser, 'UPDATE_USER');
    if (!authCheck.allowed) {
      return {
        success: false,
        error: authCheck.reason || 'Apenas o Administrador pode modificar utilizadores.',
      };
    }

    const targetUser = currentUsers.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return { success: false, error: 'Utilizador não encontrado no sistema.' };
    }

    // Prevent deactivating the main admin
    if (targetUser.role === 'ADMIN' && updates.status === 'INACTIVE') {
      return {
        success: false,
        error: 'O Administrador Principal não pode ser desativado.',
      };
    }

    // Enforce MAX 5 active sellers when changing status from INACTIVE -> ACTIVE
    if (
      targetUser.role === 'SELLER' &&
      targetUser.status === 'INACTIVE' &&
      updates.status === 'ACTIVE'
    ) {
      const limitCheck = this.canCreateOrActivateSeller(currentUsers, targetUserId);
      if (!limitCheck.allowed) {
        return {
          success: false,
          error: limitCheck.reason,
        };
      }
    }

    // Validate username change
    if (updates.username && updates.username !== targetUser.username) {
      const cleanUsername = securityEngine
        .sanitizeInput(updates.username)
        .toLowerCase()
        .replace(/\s+/g, '');
      const duplicate = currentUsers.find(
        (u) => u.id !== targetUserId && u.username.toLowerCase() === cleanUsername
      );
      if (duplicate) {
        return {
          success: false,
          error: `O utilizador "${cleanUsername}" já existe.`,
        };
      }
    }

    const updatedUsers = currentUsers.map((user) => {
      if (user.id !== targetUserId) return user;

      const cleanName = updates.name ? securityEngine.sanitizeInput(updates.name) : user.name;
      const cleanUsername = updates.username
        ? securityEngine.sanitizeInput(updates.username).toLowerCase().replace(/\s+/g, '')
        : user.username;
      const status = updates.status || user.status;

      let salt = user.salt;
      let passwordHash = user.passwordHash;

      if (updates.passwordOrPin && updates.passwordOrPin.trim().length >= 4) {
        salt = securityEngine.generateSalt(16);
        passwordHash = securityEngine.hashWithSalt(updates.passwordOrPin.trim(), salt);
      }

      return {
        ...user,
        name: cleanName,
        username: cleanUsername,
        status,
        salt,
        passwordHash,
      };
    });

    return {
      success: true,
      data: updatedUsers,
    };
  },

  // Delete a seller user (Admin only)
  deleteUser(
    adminUser: User | null,
    targetUserId: string,
    currentUsers: User[]
  ): EngineResult<User[]> {
    const authCheck = this.canPerformAction(adminUser, 'DELETE_USER');
    if (!authCheck.allowed) {
      return {
        success: false,
        error: authCheck.reason || 'Apenas o Administrador pode remover utilizadores.',
      };
    }

    const targetUser = currentUsers.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return { success: false, error: 'Utilizador não encontrado.' };
    }

    if (targetUser.role === 'ADMIN') {
      return { success: false, error: 'O Administrador Principal não pode ser removido.' };
    }

    const remaining = currentUsers.filter((u) => u.id !== targetUserId);
    return {
      success: true,
      data: remaining,
    };
  },
};
