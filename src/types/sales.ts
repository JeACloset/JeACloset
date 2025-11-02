export type PaymentMethod = 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'transferencia';

export type SaleStatus = 'pendente' | 'pago' | 'cancelado';

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
}

export interface Sale {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentual' | 'valor_fixo';
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
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
