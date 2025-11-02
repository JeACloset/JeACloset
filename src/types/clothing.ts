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
  | 'Outros';

export interface ClothingSize {
  type: 'numeric' | 'letter' | 'custom';
  value: string;
  displayName: string;
}

export interface ClothingVariation {
  id: string;
  size: ClothingSize;
  color: string; // Cor escrita manualmente
  quantity: number;
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
