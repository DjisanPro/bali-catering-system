import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore, getFirebaseAuth, isFirebaseConfigured } from './firebase';
import {
  Product,
  Category,
  Ingredient,
  Order,
  StockMovement,
  Customer,
  SiteSettings,
  HomepageSection,
  Banner,
  ContactMessage,
  AuditLog,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firestoreService = {
  // --- SITE SETTINGS (CMS) ---
  async getSiteSettings(): Promise<SiteSettings | null> {
    const db = getFirebaseFirestore();
    if (!db) return null;
    try {
      const ref = doc(db, 'site_settings', 'main_config');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as SiteSettings;
      }
      return null;
    } catch (e: any) {
      if (e?.code === 'permission-denied' || e?.message?.includes('insufficient permissions')) {
        handleFirestoreError(e, OperationType.GET, 'site_settings/main_config');
      }
      console.warn('Could not fetch site settings from Firestore:', e);
      return null;
    }
  },

  async saveSiteSettings(settings: Partial<SiteSettings>): Promise<boolean> {
    const db = getFirebaseFirestore();
    if (!db) return false;
    try {
      const ref = doc(db, 'site_settings', 'main_config');
      await setDoc(
        ref,
        {
          ...settings,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    } catch (e: any) {
      if (e?.code === 'permission-denied' || e?.message?.includes('insufficient permissions')) {
        handleFirestoreError(e, OperationType.WRITE, 'site_settings/main_config');
      }
      console.error('Failed to save site settings to Firestore:', e);
      return false;
    }
  },

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];
    try {
      const q = query(collection(db, 'products'), where('status', '!=', 'ARCHIVED'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
    } catch (e) {
      console.warn('Could not fetch products from Firestore:', e);
      return [];
    }
  },

  async saveProduct(product: Product): Promise<boolean> {
    const db = getFirebaseFirestore();
    if (!db) return false;
    try {
      const ref = doc(db, 'products', product.id);
      await setDoc(
        ref,
        {
          ...product,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    } catch (e) {
      console.error('Failed to save product in Firestore:', e);
      return false;
    }
  },

  async softDeleteProduct(productId: string): Promise<boolean> {
    const db = getFirebaseFirestore();
    if (!db) return false;
    try {
      const ref = doc(db, 'products', productId);
      await updateDoc(ref, {
        status: 'INACTIVE',
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });
      return true;
    } catch (e) {
      console.error('Failed to soft delete product in Firestore:', e);
      return false;
    }
  },

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(200));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    } catch (e) {
      console.warn('Could not fetch orders from Firestore:', e);
      return [];
    }
  },

  async saveOrder(order: Order): Promise<boolean> {
    const db = getFirebaseFirestore();
    if (!db) return false;
    try {
      const ref = doc(db, 'orders', order.id);
      await setDoc(ref, order, { merge: true });
      return true;
    } catch (e) {
      console.error('Failed to save order in Firestore:', e);
      return false;
    }
  },

  // --- INVENTORY & AUDIT MOVEMENTS ---
  async logStockMovement(movement: StockMovement): Promise<boolean> {
    const db = getFirebaseFirestore();
    if (!db) return false;
    try {
      const ref = doc(db, 'inventory_movements', movement.id);
      await setDoc(ref, {
        ...movement,
        createdAt: movement.createdAt || new Date().toISOString(),
      });
      return true;
    } catch (e) {
      console.error('Failed to log stock movement in Firestore:', e);
      return false;
    }
  },

  // --- CUSTOMERS ---
  async getCustomers(): Promise<Customer[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'customers'));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
    } catch (e) {
      console.warn('Could not fetch customers from Firestore:', e);
      return [];
    }
  },

  async saveCustomer(customer: Customer): Promise<boolean> {
    const db = getFirebaseFirestore();
    if (!db) return false;
    try {
      const ref = doc(db, 'customers', customer.id);
      await setDoc(ref, customer, { merge: true });
      return true;
    } catch (e) {
      console.error('Failed to save customer in Firestore:', e);
      return false;
    }
  },

  // --- CONTACT MESSAGES ---
  async sendContactMessage(msg: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>): Promise<boolean> {
    const db = getFirebaseFirestore();
    if (!db) return false;
    try {
      await addDoc(collection(db, 'contact_messages'), {
        ...msg,
        status: 'UNREAD',
        createdAt: new Date().toISOString(),
      });
      return true;
    } catch (e) {
      console.error('Failed to submit contact message to Firestore:', e);
      return false;
    }
  },

  // --- AUDIT LOGS ---
  async logAudit(entry: AuditLog): Promise<boolean> {
    const db = getFirebaseFirestore();
    if (!db) return false;
    try {
      const ref = doc(db, 'audit_logs', entry.id);
      await setDoc(ref, entry);
      return true;
    } catch (e) {
      console.error('Failed to record audit log in Firestore:', e);
      return false;
    }
  },
};
