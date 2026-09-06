import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from './firebase';
import { UserRole, PermissionAction, User } from '../types';

export const BOOTSTRAP_SUPER_ADMIN_EMAIL = 'gerson.gamay@gmail.com';

// Granular permissions mapping across the enterprise hierarchy
export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  SUPER_ADMIN: [
    'MANAGE_PRODUCTS',
    'MANAGE_INVENTORY',
    'MANAGE_ORDERS',
    'MANAGE_CUSTOMERS',
    'MANAGE_MEDIA',
    'MANAGE_CMS',
    'MANAGE_USERS',
    'VIEW_ANALYTICS',
    'VIEW_AUDIT_LOGS',
    'MANAGE_SETTINGS',
    'VIEW_DASHBOARD',
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
    'CHANGE_PRODUCT_PRICE',
    'CREATE_PRODUCT',
    'UPDATE_PRODUCT',
    'DELETE_PRODUCT',
    'UPDATE_RECIPE',
    'CREATE_INGREDIENT',
    'UPDATE_INGREDIENT',
    'DELETE_INGREDIENT',
    'MANUAL_STOCK_ADJUSTMENT',
    'DELETE_ORDER',
    'CANCEL_COMPLETED_SALE',
    'MODIFY_COMPLETED_SALE',
    'VIEW_FULL_FINANCIALS',
    'DELETE_PAYMENT',
    'CREATE_CUSTOMER',
    'UPDATE_CUSTOMER',
    'DELETE_CUSTOMER',
    'CREATE_USER',
    'UPDATE_USER',
    'DELETE_USER',
    'UPDATE_CONFIG',
    'CREATE_BACKUP',
    'RESTORE_BACKUP',
    'RESET_DATA',
  ],
  ADMIN: [
    'MANAGE_PRODUCTS',
    'MANAGE_INVENTORY',
    'MANAGE_ORDERS',
    'MANAGE_CUSTOMERS',
    'MANAGE_MEDIA',
    'MANAGE_CMS',
    'VIEW_ANALYTICS',
    'VIEW_AUDIT_LOGS',
    'MANAGE_SETTINGS',
    'VIEW_DASHBOARD',
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
    'CHANGE_PRODUCT_PRICE',
    'CREATE_PRODUCT',
    'UPDATE_PRODUCT',
    'DELETE_PRODUCT',
    'UPDATE_RECIPE',
    'CREATE_INGREDIENT',
    'UPDATE_INGREDIENT',
    'DELETE_INGREDIENT',
    'MANUAL_STOCK_ADJUSTMENT',
    'CREATE_CUSTOMER',
    'UPDATE_CUSTOMER',
    'UPDATE_CONFIG',
    'CREATE_BACKUP',
  ],
  SELLER: [
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
  ],
  USER: [
    'CREATE_ORDER',
    'SEARCH_PRODUCT',
    'VIEW_CUSTOMER_MINIMAL',
  ],
};

/**
 * Validates whether a given role holds the requested permission action.
 */
export function hasPermission(role: UserRole | undefined, action: PermissionAction): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true; // Super Admin holds all permissions unconditionally
  const allowedActions = ROLE_PERMISSIONS[role] || [];
  return allowedActions.includes(action);
}

/**
 * Enforces hierarchy rules: An ADMIN cannot edit or alter privileges of a SUPER_ADMIN.
 */
export function canManageTargetUser(
  operatorRole: UserRole | undefined,
  targetUserRole: UserRole | undefined
): boolean {
  if (!operatorRole) return false;
  if (operatorRole === 'SUPER_ADMIN') return true;
  if (operatorRole === 'ADMIN') {
    // Admin CANNOT modify or touch Super Admin
    if (targetUserRole === 'SUPER_ADMIN') return false;
    // Admin can manage ordinary sellers or users
    return targetUserRole === 'SELLER' || targetUserRole === 'USER';
  }
  return false;
}

export interface AuthSessionData {
  firebaseUser: FirebaseUser | null;
  appUser: User | null;
  role: UserRole;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isLoggedIn: boolean;
}

export const authService = {
  /**
   * Signs in user with email & password via Firebase Authentication
   */
  async signInWithEmail(email: string, pass: string): Promise<{ user: User; error?: string }> {
    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();
    if (!auth || !db) {
      throw new Error('Serviço Firebase Auth não configurado.');
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = cred.user;

      // Fetch or bootstrap user record in Firestore
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      const isSuper = (fbUser.email || '').toLowerCase() === BOOTSTRAP_SUPER_ADMIN_EMAIL.toLowerCase();

      let appUser: User;
      if (userSnap.exists()) {
        appUser = userSnap.data() as User;
        // If email matches bootstrap super admin, ensure SUPER_ADMIN role
        if (isSuper && appUser.role !== 'SUPER_ADMIN') {
          await updateDoc(userRef, { role: 'SUPER_ADMIN', lastActivity: new Date().toISOString() });
          appUser.role = 'SUPER_ADMIN';
        }
      } else {
        // Bootstrap new user document
        const initialRole: UserRole = isSuper ? 'SUPER_ADMIN' : 'ADMIN';
        appUser = {
          id: fbUser.uid,
          name: fbUser.displayName || (isSuper ? 'Gerson Gamay (Super Admin)' : fbUser.email?.split('@')[0] || 'Administrador'),
          username: fbUser.email?.split('@')[0] || 'admin',
          email: fbUser.email || email,
          role: initialRole,
          status: 'ACTIVE',
          passwordHash: 'FIREBASE_AUTH_MANAGED',
          salt: 'FB_SALT',
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        };
        await setDoc(userRef, {
          ...appUser,
          createdAtServer: serverTimestamp(),
        });
      }

      return { user: appUser };
    } catch (err: any) {
      console.error('Firebase signInWithEmail error:', err);
      let errorMsg = 'Falha ao autenticar com email e palavra-passe.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Credenciais incorretas. Verifique o email e a palavra-passe.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Acesso bloqueado temporariamente por excesso de tentativas. Tente mais tarde.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Formato de email inválido.';
      }
      return { user: null as any, error: errorMsg };
    }
  },

  /**
   * Registers a new administrator or user with email & password in Firebase Auth
   */
  async registerUser(
    email: string,
    pass: string,
    displayName: string,
    role: UserRole
  ): Promise<{ user: User; error?: string }> {
    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();
    if (!auth || !db) {
      throw new Error('Serviço Firebase Auth não configurado.');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = cred.user;

      const isSuper = (fbUser.email || '').toLowerCase() === BOOTSTRAP_SUPER_ADMIN_EMAIL.toLowerCase();
      const finalRole: UserRole = isSuper ? 'SUPER_ADMIN' : role;

      const appUser: User = {
        id: fbUser.uid,
        name: displayName.trim() || fbUser.email?.split('@')[0] || 'Utilizador',
        username: fbUser.email?.split('@')[0] || 'user',
        email: fbUser.email || email,
        role: finalRole,
        status: 'ACTIVE',
        passwordHash: 'FIREBASE_AUTH_MANAGED',
        salt: 'FB_SALT',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };

      const userRef = doc(db, 'users', fbUser.uid);
      await setDoc(userRef, {
        ...appUser,
        createdAtServer: serverTimestamp(),
      });

      return { user: appUser };
    } catch (err: any) {
      console.error('Firebase registerUser error:', err);
      let errorMsg = 'Falha ao criar conta no Firebase Auth.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Este endereço de email já está registado no sistema.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'A palavra-passe deve conter pelo menos 6 caracteres.';
      }
      return { user: null as any, error: errorMsg };
    }
  },

  /**
   * Sends password reset email
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const auth = getFirebaseAuth();
    if (!auth) {
      return { success: false, message: 'Firebase Auth não inicializado.' };
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      return {
        success: true,
        message: `Instruções de redefinição de palavra-passe enviadas com sucesso para ${email}. Verifique a sua caixa de correio.`,
      };
    } catch (err: any) {
      console.error('Firebase sendPasswordReset error:', err);
      let message = 'Não foi possível enviar o email de redefinição.';
      if (err.code === 'auth/user-not-found') {
        message = 'Nenhuma conta encontrada com este endereço de email.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'O email fornecido não possui um formato válido.';
      }
      return { success: false, message };
    }
  },

  /**
   * Signs out the current session
   */
  async signOut(): Promise<void> {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.warn('Firebase signOut warning:', err);
      }
    }
  },

  /**
   * Listens for Firebase Auth state changes
   */
  subscribeToAuth(callback: (user: FirebaseUser | null) => void): () => void {
    const auth = getFirebaseAuth();
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
  },
};
