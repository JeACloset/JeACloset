// Tipos para o sistema de gestão de vestuário feminino

export type ClothingCategory = 
  | 'Blusas'
  | 'Camisetas'
  | 'Vestidos'
  | 'Calças'
  | 'Shorts'
  | 'Saias'
  | 'Jaquetas'
  | 'Blazers'
  | 'Casacos'
  | 'Roupas Íntimas'
  | 'Acessórios'
  | 'Calçados'
  | 'Bolsas'
  | 'Cintos'
  | 'Joias'
  | 'Outros';

export interface ClothingSize {
  type: 'numeric' | 'letter' | 'custom';
  value: string;
  displayName: string;
}

export interface ClothingVariation {
  id: string;
  size: ClothingSize;
  color: string;
  colorCode?: string;
  quantity: number;
  soldQuantity: number;
  sku?: string;
}

export interface ClothingItem {
  id: string;
  code: string; // Código da peça
  name: string;
  description?: string;
  category: ClothingCategory;
  brand?: string;
  supplier: string;
  collection?: string;
  season?: 'Verão' | 'Outono' | 'Inverno' | 'Primavera' | 'Ano Todo';
  variations: ClothingVariation[];
  costPrice: number;
  sellingPrice: number;
  freightCost?: number; // Frete por lote
  freightQuantity?: number; // Quantidade de peças por lote
  packagingCost?: number; // Custo por embalagem
  extraCosts?: number;
  profitMargin: number;
  creditFee?: number;
  status: 'available' | 'sold' | 'reserved';
  createdAt: Date;
  updatedAt: Date;
  images?: string[];
  tags?: string[];
}

export type PaymentMethod = 
  | 'dinheiro'
  | 'pix'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'transferencia'
  | 'cheque';

export interface SaleItem {
  id: string;
  clothingItemId: string;
  clothingItemCode: string;
  clothingItemName: string;
  variationId: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  subtotal: number;
  discount: number;
  discountType: 'percentual' | 'valor_fixo';
  total: number;
  paymentMethod: PaymentMethod;
  status: 'pendente' | 'pago' | 'cancelado';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  sellerId?: string;
  sellerName?: string;
}

export interface SaleFormData {
  customerName: string;
  customerPhone?: string;
  saleDate: string; // Data da venda no formato YYYY-MM-DD
  discount: number;
  discountType: 'percentual' | 'valor_fixo';
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Investment {
  id: string;
  supplier: string;
  date: Date;
  totalItems: number;
  soldItems: number;
  totalCost: number;
  totalSold: number;
  profit: number;
  progress: number;
  status: 'red' | 'yellow' | 'green';
  createdAt: Date;
  updatedAt: Date;
}

export interface CashFlow {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: Date;
  relatedSaleId?: string;
  relatedInvestmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}

export interface DashboardStats {
  totalItems: number;
  availableItems: number;
  soldItems: number;
  totalValue: number;
  expectedProfit: number;
  monthlySales: number;
  monthlyProfit: number;
  topCategories: Array<{
    category: ClothingCategory;
    count: number;
    value: number;
  }>;
  recentSales: Sale[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  type: 'problem' | 'improvement' | 'general';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  relatedTab: 'clothing' | 'inventory' | 'sales' | 'history' | 'reports' | 'investments' | 'cashflow' | 'notes' | 'account';
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  category?: ClothingCategory;
  supplier?: string;
  paymentMethod?: PaymentMethod;
  status?: string;
}