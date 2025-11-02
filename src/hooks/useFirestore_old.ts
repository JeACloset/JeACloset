import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Detect current role from localStorage
function getCurrentUserRole(): 'admin' | 'user' | 'viewer' | null {
  try {
    const raw = localStorage.getItem('JEACLOSET_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.role ?? null;
  } catch {
    return null;
  }
}

// Demo datasets for viewer mode (lightweight and generic)
function getDemoData(collectionName: string): any[] {
  // Allow overriding via localStorage for easier manual tweaks
  try {
    const override = localStorage.getItem(`JEACLOSET_demo_data_${collectionName}`);
    if (override) {
      const parsed = JSON.parse(override);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  if (collectionName === 'clothing') {
    return [
      {
        id: 'demo-CL-1',
        code: 'CAM-001',
        name: 'Camiseta Básica',
        description: 'Camiseta de algodão 100% com estampa personalizada',
        category: 'Camisetas',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 25.00,
        freightPerUnit: 2.50,
        packagingCost: 1.00,
        baseCost: 28.50,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.00,
        salePrice: 49.90,
        sellingPrice: 49.90,
        profit: 20.40,
        status: 'available',
        createdAt: new Date('2024-12-15'),
        updatedAt: new Date('2025-01-10'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 2, soldQuantity: 3 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Azul', quantity: 1, soldQuantity: 2 },
          { id: 'v3', size: { label: 'P', value: 'P' }, color: 'Rosa', quantity: 0, soldQuantity: 1 }
        ]
      },
      {
        id: 'demo-CL-2',
        code: 'SAI-002',
        name: 'Saia Midi Floral',
        description: 'Saia midi com estampa floral delicada',
        category: 'Saias',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 45.00,
        freightPerUnit: 4.50,
        packagingCost: 2.00,
        baseCost: 51.50,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.80,
        salePrice: 89.90,
        sellingPrice: 89.90,
        profit: 36.60,
        status: 'available',
        createdAt: new Date('2024-12-20'),
        updatedAt: new Date('2025-01-12'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Azul', quantity: 3, soldQuantity: 0 },
          { id: 'v3', size: { label: 'P', value: 'P' }, color: 'Verde', quantity: 2, soldQuantity: 1 }
        ]
      },
      {
        id: 'demo-CL-3',
        code: 'VES-003',
        name: 'Vestido Elegante',
        description: 'Vestido elegante para ocasiões especiais',
        category: 'Vestidos',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 65.00,
        freightPerUnit: 6.50,
        packagingCost: 3.00,
        baseCost: 74.50,
        creditFeePercent: 3.5,
        creditFeeAmount: 2.61,
        salePrice: 129.90,
        sellingPrice: 129.90,
        profit: 52.79,
        status: 'available',
        createdAt: new Date('2024-12-25'),
        updatedAt: new Date('2025-01-15'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Preto', quantity: 0, soldQuantity: 2 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Vermelho', quantity: 1, soldQuantity: 1 }
        ]
      },
      {
        id: 'demo-CL-4',
        code: 'CAL-004',
        name: 'Calça Jeans',
        description: 'Calça jeans clássica com corte moderno',
        category: 'Calças',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 55.00,
        freightPerUnit: 5.50,
        packagingCost: 2.50,
        baseCost: 63.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 2.21,
        salePrice: 99.90,
        sellingPrice: 99.90,
        profit: 34.69,
        status: 'available',
        createdAt: new Date('2024-12-30'),
        updatedAt: new Date('2025-01-18'),
        variations: [
          { id: 'v1', size: { label: '38', value: '38' }, color: 'Azul', quantity: 4, soldQuantity: 1 },
          { id: 'v2', size: { label: '40', value: '40' }, color: 'Azul', quantity: 2, soldQuantity: 3 },
          { id: 'v3', size: { label: '42', value: '42' }, color: 'Preto', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-5',
        code: 'BLA-005',
        name: 'Blazer Executivo',
        description: 'Blazer elegante para ocasiões profissionais',
        category: 'Blazers',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 85.00,
        freightPerUnit: 8.50,
        packagingCost: 4.00,
        baseCost: 97.50,
        creditFeePercent: 3.5,
        creditFeeAmount: 3.41,
        salePrice: 159.90,
        sellingPrice: 159.90,
        profit: 59.00,
        status: 'available',
        createdAt: new Date('2025-01-05'),
        updatedAt: new Date('2025-01-20'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Preto', quantity: 0, soldQuantity: 2 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Cinza', quantity: 0, soldQuantity: 1 }
        ]
      },
      {
        id: 'demo-CL-4',
        code: 'CAL-004',
        name: 'Calça Jeans Skinny',
        description: 'Calça jeans skinny com elastano',
        category: 'Calças',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 55.00,
        freightPerUnit: 5.50,
        packagingCost: 2.50,
        baseCost: 63.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 2.21,
        salePrice: 119.90,
        sellingPrice: 119.90,
        profit: 54.69,
        status: 'available',
        createdAt: new Date('2024-12-30'),
        updatedAt: new Date('2025-01-18'),
        variations: [
          { id: 'v1', size: { label: '38', value: '38' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: '38', value: '38' }, color: 'Azul', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-5',
        code: 'BLA-005',
        name: 'Blusa de Seda',
        description: 'Blusa de seda com detalhes em renda',
        category: 'Blusas',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 35.00,
        freightPerUnit: 3.50,
        packagingCost: 1.50,
        baseCost: 40.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.40,
        salePrice: 79.90,
        sellingPrice: 79.90,
        profit: 38.50,
        status: 'available',
        createdAt: new Date('2025-01-05'),
        updatedAt: new Date('2025-01-20'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'M', value: 'M' }, color: 'Azul', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-6',
        code: 'SHO-006',
        name: 'Short Jeans',
        category: 'Shorts',
        description: 'Short jeans confortável para o dia a dia',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 35.00,
        freightPerUnit: 3.50,
        packagingCost: 1.50,
        baseCost: 40.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.40,
        salePrice: 69.90,
        sellingPrice: 69.90,
        profit: 34.90,
        status: 'available',
        createdAt: new Date('2025-01-08'),
        updatedAt: new Date('2025-01-22'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'M', value: 'M' }, color: 'Azul', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-7',
        code: 'JAC-007',
        name: 'Jaqueta Jeans',
        category: 'Jaquetas',
        description: 'Jaqueta jeans clássica e versátil',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 55.00,
        freightPerUnit: 3.50,
        packagingCost: 1.50,
        baseCost: 60.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 2.10,
        salePrice: 99.90,
        sellingPrice: 99.90,
        profit: 44.90,
        status: 'available',
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-25'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'M', value: 'M' }, color: 'Azul', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-8',
        code: 'TOP-008',
        name: 'Top Cropped',
        category: 'Blusas',
        description: 'Top cropped moderno e estiloso',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 25.00,
        freightPerUnit: 3.50,
        packagingCost: 1.50,
        baseCost: 30.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.05,
        salePrice: 49.90,
        sellingPrice: 49.90,
        profit: 24.90,
        status: 'available',
        createdAt: new Date('2025-01-12'),
        updatedAt: new Date('2025-01-28'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'M', value: 'M' }, color: 'Azul', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-9',
        code: 'CON-009',
        name: 'Conjunto Esportivo',
        description: 'Conjunto esportivo confortável',
        category: 'Vestidos',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 45.00,
        freightPerUnit: 4.50,
        packagingCost: 2.00,
        baseCost: 51.50,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.80,
        salePrice: 89.90,
        sellingPrice: 89.90,
        profit: 36.60,
        status: 'available',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-30'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'M', value: 'M' }, color: 'Azul', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-10',
        code: 'MAC-010',
        name: 'Macacão Jeans',
        description: 'Macacão jeans moderno e versátil',
        category: 'Vestidos',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 60.00,
        freightPerUnit: 6.00,
        packagingCost: 3.00,
        baseCost: 69.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 2.42,
        salePrice: 119.90,
        sellingPrice: 119.90,
        profit: 48.48,
        status: 'available',
        createdAt: new Date('2025-01-18'),
        updatedAt: new Date('2025-02-02'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'M', value: 'M' }, color: 'Azul', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-11',
        code: 'BOL-011',
        name: 'Bolero de Tricô',
        description: 'Bolero de tricô elegante',
        category: 'Blusas',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 40.00,
        freightPerUnit: 4.00,
        packagingCost: 2.00,
        baseCost: 46.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.61,
        salePrice: 79.90,
        sellingPrice: 79.90,
        profit: 32.29,
        status: 'available',
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-02-05'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'M', value: 'M' }, color: 'Azul', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-12',
        code: 'LEG-012',
        name: 'Legging Estampada',
        description: 'Legging estampada confortável',
        category: 'Calças',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 30.00,
        freightPerUnit: 3.00,
        packagingCost: 1.50,
        baseCost: 34.50,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.21,
        salePrice: 59.90,
        sellingPrice: 59.90,
        profit: 24.19,
        status: 'available',
        createdAt: new Date('2025-01-22'),
        updatedAt: new Date('2025-02-08'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'M', value: 'M' }, color: 'Azul', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-13',
        code: 'KIM-013',
        name: 'Kimono Floral',
        description: 'Kimono floral leve e elegante',
        category: 'Blusas',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 35.00,
        freightPerUnit: 3.50,
        packagingCost: 1.50,
        baseCost: 40.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.40,
        salePrice: 69.90,
        sellingPrice: 69.90,
        profit: 28.50,
        status: 'available',
        createdAt: new Date('2025-01-25'),
        updatedAt: new Date('2025-02-10'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'M', value: 'M' }, color: 'Azul', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-14',
        code: 'BAT-014',
        name: 'Bata de Praia',
        description: 'Bata de praia confortável',
        category: 'Blusas',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 25.00,
        freightPerUnit: 2.50,
        packagingCost: 1.00,
        baseCost: 28.50,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.00,
        salePrice: 49.90,
        sellingPrice: 49.90,
        profit: 20.40,
        status: 'available',
        createdAt: new Date('2025-01-28'),
        updatedAt: new Date('2025-02-12'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'M', value: 'M' }, color: 'Azul', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-15',
        code: 'BLU-015',
        name: 'Blusa de Seda',
        description: 'Blusa de seda elegante e confortável',
        category: 'Blusas',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 35.00,
        freightPerUnit: 3.50,
        packagingCost: 1.50,
        baseCost: 40.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.40,
        salePrice: 69.90,
        sellingPrice: 69.90,
        profit: 28.50,
        status: 'available',
        createdAt: new Date('2025-01-30'),
        updatedAt: new Date('2025-02-15'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Preto', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-16',
        code: 'CAL-016',
        name: 'Calça Jeans Skinny',
        description: 'Calça jeans skinny moderna',
        category: 'Calças',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 45.00,
        freightPerUnit: 4.50,
        packagingCost: 2.00,
        baseCost: 51.50,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.80,
        salePrice: 89.90,
        sellingPrice: 89.90,
        profit: 36.60,
        status: 'available',
        createdAt: new Date('2025-02-02'),
        updatedAt: new Date('2025-02-18'),
        variations: [
          { id: 'v1', size: { label: '38', value: '38' }, color: 'Azul', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: '40', value: '40' }, color: 'Preto', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-17',
        code: 'VES-017',
        name: 'Vestido Midi Floral',
        description: 'Vestido midi com estampa floral delicada',
        category: 'Vestidos',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 55.00,
        freightPerUnit: 5.50,
        packagingCost: 2.50,
        baseCost: 63.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 2.21,
        salePrice: 109.90,
        sellingPrice: 109.90,
        profit: 44.69,
        status: 'available',
        createdAt: new Date('2025-02-05'),
        updatedAt: new Date('2025-02-20'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Rosa', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Azul', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-18',
        code: 'SHO-018',
        name: 'Short Jeans Desfiado',
        description: 'Short jeans com detalhes desfiados',
        category: 'Shorts',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 30.00,
        freightPerUnit: 3.00,
        packagingCost: 1.50,
        baseCost: 34.50,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.21,
        salePrice: 59.90,
        sellingPrice: 59.90,
        profit: 24.19,
        status: 'available',
        createdAt: new Date('2025-02-08'),
        updatedAt: new Date('2025-02-22'),
        variations: [
          { id: 'v1', size: { label: '38', value: '38' }, color: 'Azul', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: '40', value: '40' }, color: 'Preto', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-19',
        code: 'JAC-019',
        name: 'Jaqueta de Couro Sintético',
        description: 'Jaqueta de couro sintético moderna',
        category: 'Jaquetas',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 70.00,
        freightPerUnit: 7.00,
        packagingCost: 3.00,
        baseCost: 80.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 2.80,
        salePrice: 139.90,
        sellingPrice: 139.90,
        profit: 57.10,
        status: 'available',
        createdAt: new Date('2025-02-10'),
        updatedAt: new Date('2025-02-25'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Preto', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Marrom', quantity: 1, soldQuantity: 0 }
        ]
      },
      {
        id: 'demo-CL-20',
        code: 'BLA-020',
        name: 'Blazer Clássico',
        description: 'Blazer clássico para ocasiões formais',
        category: 'Blazers',
        brand: 'Kaylla Fashion',
        supplier: 'Fornecedor Textil SP',
        costPrice: 80.00,
        freightPerUnit: 8.00,
        packagingCost: 3.50,
        baseCost: 91.50,
        creditFeePercent: 3.5,
        creditFeeAmount: 3.20,
        salePrice: 159.90,
        sellingPrice: 159.90,
        profit: 65.20,
        status: 'available',
        createdAt: new Date('2025-02-12'),
        updatedAt: new Date('2025-02-28'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Preto', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Azul Marinho', quantity: 1, soldQuantity: 0 }
        ]
      }
    ];
  }

  if (collectionName === 'sales') {
    return [
      {
        id: 'demo-S-1',
        customerName: 'Maria Silva',
        customerPhone: '(11) 99999-9999',
        items: [
          { id: 'item-1', clothingItemId: 'demo-CL-1', clothingItemName: 'Camiseta Básica', clothingItemCode: 'CAM-001', size: 'M', color: 'Branco', quantity: 2, unitPrice: 49.90, totalPrice: 99.80 }
        ],
        subtotal: 99.80,
        discount: 10.00,
        total: 89.80,
        paymentMethod: 'dinheiro',
        status: 'pago',
        notes: 'Cliente satisfeita com a qualidade',
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-10')
      },
      {
        id: 'demo-S-2',
        customerName: 'Ana Costa',
        customerPhone: '(11) 88888-8888',
        items: [
          { id: 'item-2', clothingItemId: 'demo-CL-2', clothingItemName: 'Saia Midi Floral', clothingItemCode: 'SAI-002', size: 'M', color: 'Floral', quantity: 1, unitPrice: 89.90, totalPrice: 89.90 }
        ],
        subtotal: 89.90,
        discount: 0,
        total: 89.90,
        paymentMethod: 'pix',
        status: 'pago',
        notes: 'Pagamento via PIX instantâneo',
        createdAt: new Date('2025-01-12'),
        updatedAt: new Date('2025-01-12')
      },
      {
        id: 'demo-S-3',
        customerName: 'Carla Santos',
        customerPhone: '(11) 77777-7777',
        items: [
          { id: 'item-3a', clothingItemId: 'demo-CL-3', clothingItemName: 'Vestido Elegante', clothingItemCode: 'VES-003', size: 'M', color: 'Azul', quantity: 1, unitPrice: 129.90, totalPrice: 129.90 },
          { id: 'item-3b', clothingItemId: 'demo-CL-5', clothingItemName: 'Blusa de Seda', clothingItemCode: 'BLA-005', size: 'M', color: 'Bege', quantity: 1, unitPrice: 79.90, totalPrice: 79.90 }
        ],
        subtotal: 209.80,
        discount: 15.00,
        total: 194.80,
        paymentMethod: 'cartao_credito',
        status: 'pago',
        notes: 'Compra para evento especial - desconto aplicado',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      },
      {
        id: 'demo-S-4',
        customerName: 'Fernanda Lima',
        customerPhone: '(11) 66666-6666',
        items: [
          { id: 'item-4', clothingItemId: 'demo-CL-4', clothingItemName: 'Calça Jeans Skinny', clothingItemCode: 'CAL-004', size: '38', color: 'Azul', quantity: 1, unitPrice: 119.90, totalPrice: 119.90 }
        ],
        subtotal: 119.90,
        discount: 0,
        total: 119.90,
        paymentMethod: 'cartao_debito',
        status: 'pago',
        notes: 'Cliente retornou para comprar novamente',
        createdAt: new Date('2025-01-18'),
        updatedAt: new Date('2025-01-18')
      },
      {
        id: 'demo-S-5',
        customerName: 'Juliana Oliveira',
        customerPhone: '(11) 55555-5555',
        items: [
          { id: 'item-5a', clothingItemId: 'demo-CL-1', clothingItemName: 'Camiseta Básica', clothingItemCode: 'CAM-001', size: 'P', color: 'Preto', quantity: 3, unitPrice: 49.90, totalPrice: 149.70 },
          { id: 'item-5b', clothingItemId: 'demo-CL-2', clothingItemName: 'Saia Midi Floral', clothingItemCode: 'SAI-002', size: 'P', color: 'Floral', quantity: 1, unitPrice: 89.90, totalPrice: 89.90 }
        ],
        subtotal: 239.60,
        discount: 20.00,
        total: 219.60,
        paymentMethod: 'cartao_credito',
        status: 'pago',
        notes: 'Compra em quantidade - desconto especial',
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-20')
      },
      {
        id: 'demo-S-6',
        customerName: 'Patricia Rocha',
        customerPhone: '(11) 44444-4444',
        items: [
          { id: 'item-6', clothingItemId: 'demo-CL-3', clothingItemName: 'Vestido Elegante', clothingItemCode: 'VES-003', size: 'G', color: 'Rosa', quantity: 1, unitPrice: 129.90, totalPrice: 129.90 }
        ],
        subtotal: 129.90,
        discount: 5.00,
        total: 124.90,
        paymentMethod: 'pix',
        status: 'pago',
        notes: 'Cliente nova - primeira compra',
        createdAt: new Date('2025-01-22'),
        updatedAt: new Date('2025-01-22')
      },
      {
        id: 'demo-S-7',
        customerName: 'Luciana Mendes',
        customerPhone: '(11) 33333-3333',
        items: [
          { id: 'item-7a', clothingItemId: 'demo-CL-1', clothingItemName: 'Camiseta Básica', clothingItemCode: 'CAM-001', size: 'G', color: 'Branco', quantity: 2, unitPrice: 49.90, totalPrice: 99.80 },
          { id: 'item-7b', clothingItemId: 'demo-CL-1', clothingItemName: 'Camiseta Básica', clothingItemCode: 'CAM-001', size: 'M', color: 'Preto', quantity: 1, unitPrice: 49.90, totalPrice: 49.90 }
        ],
        subtotal: 149.70,
        discount: 0,
        total: 149.70,
        paymentMethod: 'pix',
        status: 'pago',
        notes: 'Compra para presente',
        createdAt: new Date('2025-01-25'),
        updatedAt: new Date('2025-01-25')
      },
      {
        id: 'demo-S-8',
        customerName: 'Roberta Alves',
        customerPhone: '(11) 22222-2222',
        items: [
          { id: 'item-8', clothingItemId: 'demo-CL-2', clothingItemName: 'Saia Midi Floral', clothingItemCode: 'SAI-002', size: 'G', color: 'Floral', quantity: 1, unitPrice: 89.90, totalPrice: 89.90 }
        ],
        subtotal: 89.90,
        discount: 5.00,
        total: 84.90,
        paymentMethod: 'cartao_credito',
        status: 'pago',
        notes: 'Cliente fiel - desconto especial',
        createdAt: new Date('2025-01-28'),
        updatedAt: new Date('2025-01-28')
      },
      {
        id: 'demo-S-9',
        customerName: 'Camila Ferreira',
        customerPhone: '(11) 11111-1111',
        items: [
          { id: 'item-9a', clothingItemId: 'demo-CL-3', clothingItemName: 'Vestido Elegante', clothingItemCode: 'VES-003', size: 'P', color: 'Azul', quantity: 1, unitPrice: 129.90, totalPrice: 129.90 },
          { id: 'item-9b', clothingItemId: 'demo-CL-5', clothingItemName: 'Blusa de Seda', clothingItemCode: 'BLA-005', size: 'P', color: 'Bege', quantity: 1, unitPrice: 79.90, totalPrice: 79.90 }
        ],
        subtotal: 209.80,
        discount: 10.00,
        total: 199.80,
        paymentMethod: 'cartao_debito',
        status: 'pago',
        notes: 'Compra para casamento',
        createdAt: new Date('2025-01-30'),
        updatedAt: new Date('2025-01-30')
      },
      {
        id: 'demo-S-10',
        customerName: 'Mariana Costa',
        customerPhone: '(11) 00000-0000',
        items: [
          { id: 'item-10', clothingItemId: 'demo-CL-4', clothingItemName: 'Calça Jeans Skinny', clothingItemCode: 'CAL-004', size: '40', color: 'Azul', quantity: 1, unitPrice: 119.90, totalPrice: 119.90 }
        ],
        subtotal: 119.90,
        discount: 0,
        total: 119.90,
        paymentMethod: 'pix',
        status: 'pago',
        notes: 'Primeira compra na loja',
        createdAt: new Date('2025-02-02'),
        updatedAt: new Date('2025-02-02')
      },
      {
        id: 'demo-S-11',
        customerName: 'Beatriz Santos',
        customerPhone: '(11) 11111-1111',
        items: [
          { id: 'item-11', clothingItemId: 'demo-CL-1', clothingItemName: 'Camiseta Básica', clothingItemCode: 'CAM-001', size: 'G', color: 'Azul', quantity: 2, unitPrice: 49.90, totalPrice: 99.80 }
        ],
        subtotal: 99.80,
        discount: 0,
        total: 99.80,
        paymentMethod: 'cartao_credito',
        status: 'pendente',
        notes: 'Aguardando confirmação do pagamento',
        createdAt: new Date('2025-02-05'),
        updatedAt: new Date('2025-02-05')
      },
      {
        id: 'demo-S-12',
        customerName: 'Isabela Lima',
        customerPhone: '(11) 22222-2222',
        items: [
          { id: 'item-12a', clothingItemId: 'demo-CL-3', clothingItemName: 'Vestido Elegante', clothingItemCode: 'VES-003', size: 'M', color: 'Rosa', quantity: 1, unitPrice: 129.90, totalPrice: 129.90 },
          { id: 'item-12b', clothingItemId: 'demo-CL-5', clothingItemName: 'Blusa de Seda', clothingItemCode: 'BLA-005', size: 'M', color: 'Branco', quantity: 1, unitPrice: 79.90, totalPrice: 79.90 }
        ],
        subtotal: 209.80,
        discount: 15.00,
        total: 194.80,
        paymentMethod: 'cartao_debito',
        status: 'pendente',
        notes: 'Pagamento em análise - cartão de débito',
        createdAt: new Date('2025-02-08'),
        updatedAt: new Date('2025-02-08')
      },
      {
        id: 'demo-S-13',
        customerName: 'Fernanda Oliveira',
        customerPhone: '(11) 11111-1111',
        items: [
          { id: 'item-13', clothingItemId: 'demo-CL-6', clothingItemName: 'Short Jeans', clothingItemCode: 'SHO-006', size: 'M', color: 'Azul', quantity: 1, unitPrice: 69.90, totalPrice: 69.90 }
        ],
        subtotal: 69.90,
        discount: 0,
        total: 69.90,
        paymentMethod: 'dinheiro',
        status: 'pago',
        notes: 'Pagamento à vista',
        createdAt: new Date('2025-02-10'),
        updatedAt: new Date('2025-02-10')
      },
      {
        id: 'demo-S-14',
        customerName: 'Patricia Souza',
        customerPhone: '(11) 33333-3333',
        items: [
          { id: 'item-14', clothingItemId: 'demo-CL-7', clothingItemName: 'Jaqueta Jeans', clothingItemCode: 'JAC-007', size: 'M', color: 'Azul', quantity: 1, unitPrice: 99.90, totalPrice: 99.90 }
        ],
        subtotal: 99.90,
        discount: 5.00,
        total: 94.90,
        paymentMethod: 'pix',
        status: 'pago',
        notes: 'Desconto de cliente fiel',
        createdAt: new Date('2025-02-12'),
        updatedAt: new Date('2025-02-12')
      },
      {
        id: 'demo-S-15',
        customerName: 'Mariana Costa',
        customerPhone: '(11) 44444-4444',
        items: [
          { id: 'item-15', clothingItemId: 'demo-CL-8', clothingItemName: 'Top Cropped', clothingItemCode: 'TOP-008', size: 'M', color: 'Azul', quantity: 1, unitPrice: 49.90, totalPrice: 49.90 }
        ],
        subtotal: 49.90,
        discount: 0,
        total: 49.90,
        paymentMethod: 'cartao_credito',
        status: 'pago',
        notes: 'Compra online',
        createdAt: new Date('2025-02-14'),
        updatedAt: new Date('2025-02-14')
      },
      {
        id: 'demo-S-16',
        customerName: 'Juliana Santos',
        customerPhone: '(11) 55555-5555',
        items: [
          { id: 'item-16', clothingItemId: 'demo-CL-9', clothingItemName: 'Conjunto Esportivo', clothingItemCode: 'CON-009', size: 'M', color: 'Azul', quantity: 1, unitPrice: 89.90, totalPrice: 89.90 }
        ],
        subtotal: 89.90,
        discount: 10.00,
        total: 79.90,
        paymentMethod: 'dinheiro',
        status: 'pago',
        notes: 'Desconto por quantidade',
        createdAt: new Date('2025-02-16'),
        updatedAt: new Date('2025-02-16')
      },
      {
        id: 'demo-S-17',
        customerName: 'Camila Lima',
        customerPhone: '(11) 66666-6666',
        items: [
          { id: 'item-17', clothingItemId: 'demo-CL-10', clothingItemName: 'Macacão Jeans', clothingItemCode: 'MAC-010', size: 'M', color: 'Azul', quantity: 1, unitPrice: 119.90, totalPrice: 119.90 }
        ],
        subtotal: 119.90,
        discount: 0,
        total: 119.90,
        paymentMethod: 'pix',
        status: 'pago',
        notes: 'Pagamento via PIX',
        createdAt: new Date('2025-02-18'),
        updatedAt: new Date('2025-02-18')
      },
      {
        id: 'demo-S-18',
        customerName: 'Larissa Ferreira',
        customerPhone: '(11) 77777-7777',
        items: [
          { id: 'item-18', clothingItemId: 'demo-CL-11', clothingItemName: 'Bolero de Tricô', clothingItemCode: 'BOL-011', size: 'M', color: 'Azul', quantity: 1, unitPrice: 79.90, totalPrice: 79.90 }
        ],
        subtotal: 79.90,
        discount: 0,
        total: 79.90,
        paymentMethod: 'cartao_debito',
        status: 'pendente',
        notes: 'Aguardando confirmação do pagamento',
        createdAt: new Date('2025-02-20'),
        updatedAt: new Date('2025-02-20')
      },
      {
        id: 'demo-S-19',
        customerName: 'Beatriz Alves',
        customerPhone: '(11) 88888-8888',
        items: [
          { id: 'item-19', clothingItemId: 'demo-CL-12', clothingItemName: 'Legging Estampada', clothingItemCode: 'LEG-012', size: 'M', color: 'Azul', quantity: 1, unitPrice: 59.90, totalPrice: 59.90 }
        ],
        subtotal: 59.90,
        discount: 5.00,
        total: 54.90,
        paymentMethod: 'cartao_credito',
        status: 'pendente',
        notes: 'Pagamento em processamento',
        createdAt: new Date('2025-02-22'),
        updatedAt: new Date('2025-02-22')
      },
      {
        id: 'demo-S-20',
        customerName: 'Gabriela Rocha',
        customerPhone: '(11) 99999-9999',
        items: [
          { id: 'item-20', clothingItemId: 'demo-CL-13', clothingItemName: 'Kimono Floral', clothingItemCode: 'KIM-013', size: 'M', color: 'Azul', quantity: 1, unitPrice: 69.90, totalPrice: 69.90 }
        ],
        subtotal: 69.90,
        discount: 0,
        total: 69.90,
        paymentMethod: 'dinheiro',
        status: 'pendente',
        notes: 'Aguardando pagamento',
        createdAt: new Date('2025-02-24'),
        updatedAt: new Date('2025-02-24')
      }
    ];
  }

  if (collectionName === 'fluxo') {
    return [
      {
        id: 'demo-F-1',
        data: new Date('2025-01-05'),
        descricao: 'Compra de Estoque - Lote 1 (Camisetas e Saias)',
        tipo: 'saida',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: -300.00,
        createdAt: new Date('2025-01-05'),
        updatedAt: new Date('2025-01-05')
      },
      {
        id: 'demo-F-2',
        data: new Date('2025-01-08'),
        descricao: 'Compra de Estoque - Lote 2 (Vestidos e Calças)',
        tipo: 'saida',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: -200.00,
        createdAt: new Date('2025-01-08'),
        updatedAt: new Date('2025-01-08')
      },
      {
        id: 'demo-F-3',
        data: new Date('2025-01-10'),
        descricao: 'Venda - Maria Silva (2x Camiseta M Branco)',
        tipo: 'entrada',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: 89.80,
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-10')
      },
      {
        id: 'demo-F-4',
        data: new Date('2025-01-12'),
        descricao: 'Venda - Ana Costa (1x Saia M Floral)',
        tipo: 'entrada',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: 89.90,
        createdAt: new Date('2025-01-12'),
        updatedAt: new Date('2025-01-12')
      },
      {
        id: 'demo-F-5',
        data: new Date('2025-01-15'),
        descricao: 'Venda - Carla Santos (Vestido M Azul + Blusa M Bege)',
        tipo: 'entrada',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: 194.80,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      },
      {
        id: 'demo-F-6',
        data: new Date('2025-01-18'),
        descricao: 'Venda - Fernanda Lima (1x Calça 38 Azul)',
        tipo: 'entrada',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: 119.90,
        createdAt: new Date('2025-01-18'),
        updatedAt: new Date('2025-01-18')
      },
      {
        id: 'demo-F-7',
        data: new Date('2025-01-20'),
        descricao: 'Venda - Juliana Oliveira (3x Camiseta P Preto + 1x Saia P Floral)',
        tipo: 'entrada',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: 219.60,
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-20')
      },
      {
        id: 'demo-F-8',
        data: new Date('2025-01-22'),
        descricao: 'Venda - Patricia Rocha (1x Vestido G Rosa)',
        tipo: 'entrada',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: 124.90,
        createdAt: new Date('2025-01-22'),
        updatedAt: new Date('2025-01-22')
      },
      {
        id: 'demo-F-9',
        data: new Date('2025-01-25'),
        descricao: 'Venda - Luciana Mendes (2x Camiseta G Branco + 1x Camiseta M Preto)',
        tipo: 'entrada',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: 149.70,
        createdAt: new Date('2025-01-25'),
        updatedAt: new Date('2025-01-25')
      },
      {
        id: 'demo-F-10',
        data: new Date('2025-01-28'),
        descricao: 'Venda - Roberta Alves (1x Saia G Floral)',
        tipo: 'entrada',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: 84.90,
        createdAt: new Date('2025-01-28'),
        updatedAt: new Date('2025-01-28')
      },
      {
        id: 'demo-F-11',
        data: new Date('2025-01-30'),
        descricao: 'Venda - Camila Ferreira (1x Vestido P Azul + 1x Blusa P Bege)',
        tipo: 'entrada',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: 199.80,
        createdAt: new Date('2025-01-30'),
        updatedAt: new Date('2025-01-30')
      },
      {
        id: 'demo-F-12',
        data: new Date('2025-02-02'),
        descricao: 'Venda - Mariana Costa (1x Calça 40 Azul)',
        tipo: 'entrada',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: 119.90,
        createdAt: new Date('2025-02-02'),
        updatedAt: new Date('2025-02-02')
      },
      {
        id: 'demo-F-13',
        data: new Date('2025-01-25'),
        descricao: 'Salário - Janeiro',
        tipo: 'saida',
        origem: 'caixa',
        suborigem: 'salario',
        valor: -200.00,
        createdAt: new Date('2025-01-25'),
        updatedAt: new Date('2025-01-25')
      },
      {
        id: 'demo-F-14',
        data: new Date('2025-01-30'),
        descricao: 'Aluguel da Loja - Janeiro',
        tipo: 'saida',
        origem: 'caixa',
        suborigem: 'caixa_loja',
        valor: -150.00,
        createdAt: new Date('2025-01-30'),
        updatedAt: new Date('2025-01-30')
      },
      {
        id: 'demo-F-15',
        data: new Date('2025-01-31'),
        descricao: 'Compra de Estoque - Lote 3 (Blusas de Seda)',
        tipo: 'saida',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: -100.00,
        createdAt: new Date('2025-01-31'),
        updatedAt: new Date('2025-01-31')
      }
    ];
  }

  if (collectionName === 'investments') {
    return [
      {
        id: 'demo-INV-1',
        supplier: 'Fornecedor Textil SP',
        totalCost: 600.00,
        totalSold: 400.00,
        data: new Date('2025-01-05'),
        status: 'completed',
        items: [
          { id: 'demo-CL-1', name: 'Camiseta Básica', quantity: 8, soldQuantity: 12 },
          { id: 'demo-CL-2', name: 'Saia Midi Floral', quantity: 6, soldQuantity: 4 }
        ],
        totalVariations: 14,
        soldVariations: 16,
        progress: 100
      },
      {
        id: 'demo-INV-2',
        supplier: 'Fornecedor Textil SP',
        totalCost: 400.00,
        totalSold: 300.00,
        data: new Date('2025-01-08'),
        status: 'completed',
        items: [
          { id: 'demo-CL-3', name: 'Vestido Elegante', quantity: 8, soldQuantity: 4 },
          { id: 'demo-CL-4', name: 'Calça Jeans Skinny', quantity: 8, soldQuantity: 4 }
        ],
        totalVariations: 16,
        soldVariations: 8,
        progress: 100
      },
      {
        id: 'demo-INV-3',
        supplier: 'Fornecedor Textil SP',
        totalCost: 200.00,
        totalSold: 150.00,
        data: new Date('2025-01-31'),
        status: 'completed',
        items: [
          { id: 'demo-CL-5', name: 'Blusa de Seda', quantity: 8, soldQuantity: 5 }
        ],
        totalVariations: 8,
        soldVariations: 5,
        progress: 100
      }
    ];
  }

  if (collectionName === 'notes') {
    return [
      {
        id: 'demo-N-1',
        title: 'Reunião com Fornecedor - Próxima Semana',
        content: 'Agendar reunião para negociar preços do próximo lote de camisetas. Verificar possibilidade de desconto por volume. Objetivo: reduzir custo unitário em 10%.',
        type: 'general',
        priority: 'high',
        status: 'open',
        relatedTab: 'inventory',
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-20')
      },
      {
        id: 'demo-N-2',
        title: 'Análise de Performance - Janeiro',
        content: 'Janeiro foi excelente! Faturamento de R$ 1.373,20 com 10 vendas. Camisetas foram o produto mais vendido (35 unidades). Manter estratégia de preços.',
        type: 'general',
        priority: 'low',
        status: 'resolved',
        relatedTab: 'reports',
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-02-01')
      },
      {
        id: 'demo-N-3',
        title: 'Campanha de Marketing - Fevereiro',
        content: 'Criar campanha nas redes sociais para promover os vestidos elegantes. Focar no público feminino 25-40 anos. Orçamento: R$ 500,00.',
        type: 'improvement',
        priority: 'medium',
        status: 'in_progress',
        relatedTab: 'sales',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-28')
      },
      {
        id: 'demo-N-4',
        title: 'Controle de Estoque - Calças Jeans',
        content: 'Calças jeans 42 estão com baixa rotatividade (apenas 1 vendida). Considerar promoção ou ajuste de preço. Tamanho 38 e 40 vendem bem.',
        type: 'problem',
        priority: 'medium',
        status: 'open',
        relatedTab: 'inventory',
        createdAt: new Date('2025-01-18'),
        updatedAt: new Date('2025-01-25')
      },
      {
        id: 'demo-N-5',
        title: 'Novo Fornecedor - Blusas de Seda',
        content: 'Pesquisar novo fornecedor para blusas de seda. Atual fornecedor tem preços altos. Objetivo: reduzir custo em 15% mantendo qualidade.',
        type: 'general',
        priority: 'high',
        status: 'open',
        relatedTab: 'inventory',
        createdAt: new Date('2025-01-25'),
        updatedAt: new Date('2025-01-25')
      }
    ];
  }

  if (collectionName === 'sales') {
    return [
      {
        id: 'demo-SALE-1',
        customerName: 'Maria Silva',
        customerPhone: '(11) 99999-1111',
        items: [
          {
            clothingItemId: 'demo-CL-1',
            clothingItemCode: 'CAM-001',
            clothingItemName: 'Camiseta Básica',
            variationId: 'v1',
            size: 'M',
            color: 'Branco',
            quantity: 2,
            unitPrice: 49.90,
            totalPrice: 99.80
          }
        ],
        discount: 0,
        discountType: 'percentual',
        total: 99.80,
        paymentMethod: 'dinheiro',
        status: 'pago',
        notes: 'Cliente satisfeita com a qualidade',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      },
      {
        id: 'demo-SALE-2',
        customerName: 'João Santos',
        customerPhone: '(11) 99999-2222',
        items: [
          {
            clothingItemId: 'demo-CL-2',
            clothingItemCode: 'SAI-002',
            clothingItemName: 'Saia Midi Floral',
            variationId: 'v1',
            size: 'M',
            color: 'Branco',
            quantity: 1,
            unitPrice: 89.90,
            totalPrice: 89.90
          },
          {
            clothingItemId: 'demo-CL-4',
            clothingItemCode: 'CAL-004',
            clothingItemName: 'Calça Jeans',
            variationId: 'v2',
            size: '40',
            color: 'Azul',
            quantity: 1,
            unitPrice: 99.90,
            totalPrice: 99.90
          }
        ],
        discount: 10,
        discountType: 'percentual',
        total: 170.82,
        paymentMethod: 'cartao',
        status: 'pago',
        notes: 'Compra para presente',
        createdAt: new Date('2025-01-18'),
        updatedAt: new Date('2025-01-18')
      },
      {
        id: 'demo-SALE-3',
        customerName: 'Ana Costa',
        customerPhone: '(11) 99999-3333',
        items: [
          {
            clothingItemId: 'demo-CL-3',
            clothingItemCode: 'VES-003',
            clothingItemName: 'Vestido Elegante',
            variationId: 'v1',
            size: 'M',
            color: 'Preto',
            quantity: 1,
            unitPrice: 129.90,
            totalPrice: 129.90
          }
        ],
        discount: 0,
        discountType: 'percentual',
        total: 129.90,
        paymentMethod: 'pix',
        status: 'pendente',
        notes: 'Aguardando pagamento',
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-20')
      }
    ];
  }

  if (collectionName === 'fluxo') {
    return [
      {
        id: 'demo-FLUXO-1',
        data: new Date('2025-01-10'),
        descricao: 'Compra de material para produção',
        tipo: 'saida',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: 500.00,
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-10')
      },
      {
        id: 'demo-FLUXO-2',
        data: new Date('2025-01-12'),
        descricao: 'Pagamento de funcionário',
        tipo: 'saida',
        origem: 'caixa',
        suborigem: 'salario',
        valor: 300.00,
        createdAt: new Date('2025-01-12'),
        updatedAt: new Date('2025-01-12')
      },
      {
        id: 'demo-FLUXO-3',
        data: new Date('2025-01-15'),
        descricao: 'Compra de embalagens',
        tipo: 'saida',
        origem: 'embalagem',
        valor: 150.00,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      }
    ];
  }

  return [];
}

export function useFirestore<T>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Carregar dados automaticamente quando o hook é usado com real-time updates
  useEffect(() => {
    const role = getCurrentUserRole();
    const isViewer = role === 'viewer';
    console.log('useFirestore:', collectionName, '- role:', role);

    if (isViewer) {
      // For viewer, serve demo data and skip Firestore subscriptions
      console.log('useFirestore: Modo viewer - usando dados demonstrativos para', collectionName);
      setLoading(true);
      setError(null);
      setInitialized(false);
      
      // Usar setTimeout para simular carregamento e evitar problemas de renderização
      setTimeout(() => {
        const demo = getDemoData(collectionName) as T[];
        console.log('useFirestore: Dados demo carregados para', collectionName, '- Quantidade:', demo.length);
        setData(demo);
        setLoading(false);
        setError(null);
        setInitialized(true);
      }, 100);
      
      // Return noop cleanup
      return () => {};
    }

    console.log('useFirestore: Iniciando onSnapshot para coleção:', collectionName);
    setLoading(true);
    setError(null);
    setInitialized(false);
    
    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (querySnapshot) => {
        console.log('useFirestore: onSnapshot recebeu dados para:', collectionName, '- Tamanho:', querySnapshot.size);
        const items: T[] = [];
        querySnapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...convertTimestamps(doc.data())
          } as T);
        });
        console.log('useFirestore: Dados processados:', items.length, 'documentos');
        setData(items);
        setLoading(false);
        setError(null);
        setInitialized(true);
      },
      (error) => {
        console.error('useFirestore: Erro ao carregar dados:', error);
        setError('Erro ao carregar dados');
        setLoading(false);
        setInitialized(true);
      }
    );

    return () => {
      console.log('useFirestore: Cleanup onSnapshot para coleção:', collectionName);
      unsubscribe();
    };
  }, [collectionName]);

  // Converter Timestamp do Firebase para Date
  const convertTimestamps = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Timestamp) {
      console.log('useFirestore: Convertendo Timestamp para Date');
      return obj.toDate();
    }
    if (Array.isArray(obj)) {
      console.log('useFirestore: Convertendo array com', obj.length, 'itens');
      return obj.map(convertTimestamps);
    }
    if (typeof obj === 'object') {
      console.log('useFirestore: Convertendo objeto com', Object.keys(obj).length, 'propriedades');
      const converted: any = {};
      for (const key in obj) {
        converted[key] = convertTimestamps(obj[key]);
      }
      return converted;
    }
    return obj;
  };

  // Buscar todos os documentos
  const fetchAll = async () => {
    const role = getCurrentUserRole();
    if (role === 'viewer') {
      console.log('useFirestore.fetchAll: Modo viewer - retornando dados demonstrativos');
      setData(getDemoData(collectionName) as T[]);
      setLoading(false);
      return;
    }
    try {
      console.log('useFirestore: fetchAll chamado para coleção:', collectionName);
      console.log('useFirestore: Carregando dados da coleção:', collectionName);
      setLoading(true);
      setError(null);
      const querySnapshot = await getDocs(collection(db, collectionName));
      console.log('useFirestore: QuerySnapshot recebido:', querySnapshot.size, 'documentos');
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as T[];
      console.log('useFirestore: Dados carregados:', docs.length, 'documentos');
      setData(docs);
    } catch (err) {
      console.error('useFirestore: Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  // Buscar documento por ID
  const fetchById = async (id: string): Promise<T | null> => {
    const role = getCurrentUserRole();
    if (role === 'viewer') {
      const demo = (getDemoData(collectionName) as any[]).find(d => d.id === id) ?? null;
      return demo as T | null;
    }
    try {
      console.log('useFirestore: fetchById chamado para ID:', id, 'na coleção:', collectionName);
      console.log('useFirestore: Buscando documento por ID:', id, 'na coleção:', collectionName);
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      console.log('useFirestore: Documento existe:', docSnap.exists());
      if (docSnap.exists()) {
        console.log('useFirestore: Documento encontrado:', docSnap.id);
        return {
          id: docSnap.id,
          ...convertTimestamps(docSnap.data())
        } as T;
      }
      console.log('useFirestore: Documento não encontrado');
      return null;
    } catch (err) {
      console.error('useFirestore: Erro ao buscar documento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar documento');
      return null;
    }
  };

  // Adicionar documento
  const add = async (item: Omit<T, 'id'>): Promise<string | null> => {
    const role = getCurrentUserRole();
    if (role === 'viewer') {
      console.warn('useFirestore.add: Operação bloqueada para viewer (somente visualização)');
      setError('🔒 Modo Demonstração: Esta é uma conta de visualização. Alterações não são permitidas. Para usar todas as funcionalidades, faça login com uma conta de administrador ou usuário.');
      return null;
    }
    try {
      console.log('🔍 useFirestore: Adicionando documento na coleção:', collectionName);
      console.log('🔍 useFirestore: Dados do item:', JSON.stringify(item, null, 2));
      console.log('🔍 useFirestore: DB object:', db);
      console.log('🔍 useFirestore: Collection exists?', collection(db, collectionName));
      setError(null);
      
      // Remover campos undefined antes de enviar para o Firebase
      const cleanItem = Object.fromEntries(
        Object.entries(item).filter(([_, value]) => value !== undefined)
      );
      
      const dataToSave = {
        ...cleanItem,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      console.log('🔍 useFirestore: Dados para salvar:', JSON.stringify(dataToSave, null, 2));
      
      console.log('🔍 useFirestore: Chamando addDoc...');
      const docRef = await addDoc(collection(db, collectionName), dataToSave);
      console.log('✅ useFirestore: addDoc retornou:', docRef);
      console.log('✅ useFirestore: Documento adicionado com ID:', docRef.id);
      console.log('✅ useFirestore: Tipo do ID:', typeof docRef.id);
      console.log('✅ useFirestore: ID válido?', docRef.id && docRef.id.length > 0);
      
      if (!docRef || !docRef.id) {
        console.error('❌ useFirestore: ERRO - docRef ou docRef.id é inválido!');
        console.error('❌ useFirestore: docRef:', docRef);
        return null;
      }
      
      console.log('✅ useFirestore: Documento salvo com sucesso! ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('❌ useFirestore: Erro ao adicionar documento:', err);
      console.error('❌ useFirestore: Detalhes do erro:', err);
      console.error('❌ useFirestore: Stack do erro:', err instanceof Error ? err.stack : 'N/A');
      setError(err instanceof Error ? err.message : 'Erro ao adicionar documento');
      return null;
    }
  };

  // Atualizar documento
  const update = async (id: string, updates: Partial<T>): Promise<boolean> => {
    const role = getCurrentUserRole();
    if (role === 'viewer') {
      console.warn('useFirestore.update: Operação bloqueada para viewer (somente visualização)');
      setError('🔒 Modo Demonstração: Esta é uma conta de visualização. Alterações não são permitidas. Para usar todas as funcionalidades, faça login com uma conta de administrador ou usuário.');
      return false;
    }
    try {
      console.log('useFirestore: update chamado para ID:', id, 'na coleção:', collectionName);
      console.log('useFirestore: Atualizando documento na coleção:', collectionName);
      console.log('useFirestore: ID do documento:', id);
      console.log('useFirestore: Dados para atualizar:', updates);
      setError(null);
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
      console.log('useFirestore: Documento atualizado com sucesso');
      console.log('useFirestore: Documento atualizado com sucesso');
      return true;
    } catch (err) {
      console.error('useFirestore: Erro ao atualizar documento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar documento');
      return false;
    }
  };

  // Deletar documento
  const remove = async (id: string): Promise<boolean> => {
    const role = getCurrentUserRole();
    if (role === 'viewer') {
      console.warn('useFirestore.remove: Operação bloqueada para viewer (somente visualização)');
      setError('🔒 Modo Demonstração: Esta é uma conta de visualização. Alterações não são permitidas. Para usar todas as funcionalidades, faça login com uma conta de administrador ou usuário.');
      return false;
    }
    try {
      console.log('useFirestore: remove chamado para ID:', id, 'na coleção:', collectionName);
      console.log('useFirestore: Deletando documento:', id, 'na coleção:', collectionName);
      setError(null);
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      console.log('useFirestore: Documento deletado com sucesso');
      console.log('useFirestore: Documento deletado com sucesso');
      return true;
    } catch (err) {
      console.error('useFirestore: Erro ao deletar documento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar documento');
      return false;
    }
  };

  // Buscar com filtros
  const queryData = async (filters: any[] = [], orderByField?: string, orderDirection: 'asc' | 'desc' = 'asc', limitCount?: number) => {
    const role = getCurrentUserRole();
    if (role === 'viewer') {
      console.log('useFirestore.queryData: Modo viewer - retornando dados demonstrativos');
      setData(getDemoData(collectionName) as T[]);
      setLoading(false);
      return;
    }
    try {
      console.log('useFirestore: queryData chamado para coleção:', collectionName);
      console.log('useFirestore: Buscando com filtros na coleção:', collectionName);
      setLoading(true);
      setError(null);
      
      let q = query(collection(db, collectionName));
      
      // Aplicar filtros
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
      
      // Aplicar ordenação
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection));
      }
      
      // Aplicar limite
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as T[];
      
      console.log('useFirestore: Dados encontrados com filtros:', docs.length, 'documentos');
      setData(docs);
    } catch (err) {
      console.error('useFirestore: Erro ao buscar dados com filtros:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  // Escutar mudanças em tempo real
  const subscribe = (filters: any[] = [], orderByField?: string, orderDirection: 'asc' | 'desc' = 'asc') => {
    useEffect(() => {
      const role = getCurrentUserRole();
      if (role === 'viewer') {
        console.log('useFirestore.subscribe: Modo viewer - usando dados demonstrativos e ignorando Firestore');
        setData(getDemoData(collectionName) as T[]);
        setLoading(false);
        return () => {};
      }
      console.log('useFirestore: subscribe chamado para coleção:', collectionName);
      console.log('useFirestore: Iniciando subscribe para coleção:', collectionName);
      let q = query(collection(db, collectionName));
      
      // Aplicar filtros
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
      
      // Aplicar ordenação
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection));
      }
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('useFirestore: Subscribe recebeu dados para:', collectionName);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...convertTimestamps(doc.data())
        })) as T[];
        setData(docs);
        setLoading(false);
      }, (err) => {
        console.error('useFirestore: Erro no subscribe:', err);
        setError(err.message);
        setLoading(false);
      });
      
      return () => unsubscribe();
    }, []);
  };

  console.log('useFirestore: Retornando hook para coleção:', collectionName, '- Dados:', data.length, 'documentos', '- Inicializado:', initialized);
  return {
    data,
    loading,
    error,
    initialized,
    fetchAll,
    fetchById,
    add,
    update,
    remove,
    queryData,
    subscribe
  };
}

// Funções para gerenciar usuários no Firebase
export const useUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Converter Timestamp do Firebase para Date
  const convertTimestamps = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Timestamp) {
      return obj.toDate();
    }
    if (Array.isArray(obj)) {
      return obj.map(convertTimestamps);
    }
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        converted[key] = convertTimestamps(obj[key]);
      }
      return converted;
    }
    return obj;
  };

  // Carregar usuários do Firebase
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      }));
      setUsers(usersData);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar usuário no Firebase
  const updateUser = async (userId: string, updates: any) => {
    try {
      setError(null);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      // Atualizar lista local
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...updates, updatedAt: new Date() } : user
      ));
      
      return true;
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
      return false;
    }
  };

  // Criar usuário no Firebase
  const createUser = async (userData: any) => {
    try {
      console.log('🆕 createUser: Iniciando criação de usuário no Firebase');
      console.log('🆕 createUser: Dados do usuário:', userData);
      setError(null);
      
      // Verificar se o usuário já existe antes de criar
      const existingUser = await getUserByEmail(userData.email);
      if (existingUser) {
        console.log('⚠️ createUser: Usuário já existe, retornando ID existente:', existingUser.id);
        return existingUser.id;
      }
      
      const docRef = await addDoc(collection(db, 'users'), {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ createUser: Usuário criado com sucesso, ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('❌ createUser: Erro ao criar usuário:', err);
      console.error('❌ createUser: Detalhes do erro:', {
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        stack: err instanceof Error ? err.stack : 'N/A',
        userData: userData
      });
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário');
      return null;
    }
  };

  // Buscar usuário por email
  const getUserByEmail = async (email: string) => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...convertTimestamps(doc.data())
        };
      }
      return null;
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar usuário');
      return null;
    }
  };

  return {
    users,
    loading,
    error,
    loadUsers,
    updateUser,
    createUser,
    getUserByEmail
  };
};
