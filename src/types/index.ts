export type UnitOfMeasure = 'kg' | 'g' | 'l' | 'ml' | 'un' | 'porcao';

export type StockMovementType = 'ENTRY' | 'EXIT_ORDER' | 'EXIT_WASTE' | 'ADJUSTMENT';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'EVENT_CATERING';

export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID';

export type PaymentMethod = 'CASH' | 'MPESA' | 'EMOLA' | 'POS_CARD' | 'BANK_TRANSFER';

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description?: string;
  displayOrder: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  unit: UnitOfMeasure;
  quantity: number; // Quantity needed per product unit
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number; // in Meticais (MT)
  costPrice?: number; // Calculated or estimated
  imageUrl: string;
  isAvailable: boolean;
  isSpecialty?: boolean;
  isFeatured?: boolean;
  isSeasonal?: boolean;
  availabilityDays?: string[]; // e.g., ['Domingo', 'Segunda'] for Dobrada
  preparationTimeMinutes: number;
  ingredients: RecipeIngredient[];
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: UnitOfMeasure;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number; // Cost in MT per unit
  supplier?: string;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unit: UnitOfMeasure;
  type: StockMovementType;
  quantity: number; // Always positive magnitude
  previousStock: number;
  newStock: number;
  reason: string;
  referenceOrderId?: string;
  referenceOrderNumber?: string;
  performedBy: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  unitCost?: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "BC-1042"
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  orderType: OrderType;
  tableNumber?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  stockDeducted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED';
  notes?: string;
  createdAt: string;
  receivedBy: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: 'PRODUCT' | 'ORDER' | 'STOCK' | 'PAYMENT' | 'INGREDIENT' | 'SETTING' | 'CUSTOMER';
  entityId: string;
  description: string;
  user: string;
  timestamp: string;
}

export interface RestaurantConfig {
  name: string;
  tagline: string;
  location: string;
  locationDetails: string;
  phones: string[];
  whatsappPrimary: string;
  whatsappSecondary: string;
  email: string;
  currency: string;
  defaultDeliveryFee: number;
  openingHoursWeekday: string;
  openingHoursWeekend: string;
  autoDeductStockOnConfirm: boolean;
  specialNotice?: string;
  adminPinCode?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}
