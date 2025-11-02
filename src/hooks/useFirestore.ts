import { useState, useEffect } from 'react';
import type { User } from '../types';


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
      // 1. Blusa Básica - 3 variações
      {
        id: 'demo-CL-1',
        code: 'BLU-001',
        name: 'Blusa Básica',
        description: 'Blusa de algodão 100% com corte clássico',
        category: 'Blusas',
        brand: 'J&A CLOSET',
        supplier: 'Moda & Estilo Ltda',
        costPrice: 28.00,
        freightPerUnit: 2.80,
        packagingCost: 1.20,
        baseCost: 32.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.12,
        salePrice: 59.90,
        sellingPrice: 59.90,
        profit: 26.78,
        status: 'available',
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2025-01-10'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 1, soldQuantity: 2 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Preto', quantity: 1, soldQuantity: 2 },
          { id: 'v3', size: { label: 'P', value: 'P' }, color: 'Azul', quantity: 1, soldQuantity: 2 }
        ]
      },
      // 2. Calça Jeans Skinny - 4 variações
      {
        id: 'demo-CL-2',
        code: 'CAL-002',
        name: 'Calça Jeans Skinny',
        description: 'Calça jeans skinny com elastano para conforto',
        category: 'Calças',
        brand: 'J&A CLOSET',
        supplier: 'Jeans Brasil Confecções',
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
        createdAt: new Date('2024-12-02'),
        updatedAt: new Date('2025-01-11'),
        variations: [
          { id: 'v1', size: { label: '38', value: '38' }, color: 'Azul', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: '40', value: '40' }, color: 'Azul', quantity: 1, soldQuantity: 1 },
          { id: 'v3', size: { label: '42', value: '42' }, color: 'Preto', quantity: 1, soldQuantity: 1 },
          { id: 'v4', size: { label: '38', value: '38' }, color: 'Branco', quantity: 2, soldQuantity: 0 }
        ]
      },
      // 3. Calça Social - 3 variações
      {
        id: 'demo-CL-9',
        code: 'CAL-009',
        name: 'Calça Social',
        description: 'Calça social com corte clássico',
        category: 'Calças',
        brand: 'J&A CLOSET',
        supplier: 'Moda & Estilo Ltda',
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
        createdAt: new Date('2024-12-09'),
        updatedAt: new Date('2025-01-18'),
        variations: [
          { id: 'v1', size: { label: '38', value: '38' }, color: 'Preto', quantity: 2, soldQuantity: 0 },
          { id: 'v2', size: { label: '40', value: '40' }, color: 'Cinza', quantity: 2, soldQuantity: 0 },
          { id: 'v3', size: { label: '42', value: '42' }, color: 'Azul', quantity: 1, soldQuantity: 2 }
        ]
      },
      // 4. Saia Midi Floral - 3 variações
      {
        id: 'demo-CL-4',
        code: 'SAI-004',
        name: 'Saia Midi Floral',
        description: 'Saia midi com estampa floral delicada',
        category: 'Saias',
        brand: 'J&A CLOSET',
        supplier: 'Moda & Estilo Ltda',
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
        createdAt: new Date('2024-12-04'),
        updatedAt: new Date('2025-01-13'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 0, soldQuantity: 2 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Rosa', quantity: 2, soldQuantity: 0 },
          { id: 'v3', size: { label: 'P', value: 'P' }, color: 'Verde', quantity: 0, soldQuantity: 3 }
        ]
      },
      // 5. Saia Longa - 2 variações
      {
        id: 'demo-CL-13',
        code: 'SAI-013',
        name: 'Saia Longa',
        description: 'Saia longa com estampa étnica',
        category: 'Saias',
        brand: 'J&A CLOSET',
        supplier: 'Moda & Estilo Ltda',
        costPrice: 48.00,
        freightPerUnit: 4.80,
        packagingCost: 2.20,
        baseCost: 55.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.93,
        salePrice: 99.90,
        sellingPrice: 99.90,
        profit: 42.97,
        status: 'available',
        createdAt: new Date('2024-12-13'),
        updatedAt: new Date('2025-01-22'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Multicolor', quantity: 1, soldQuantity: 1 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Azul', quantity: 1, soldQuantity: 1 }
        ]
      },
      // 6. Blazer Executivo - 2 variações
      {
        id: 'demo-CL-5',
        code: 'BLA-005',
        name: 'Blazer Executivo',
        description: 'Blazer elegante para ocasiões profissionais',
        category: 'Blazers',
        brand: 'J&A CLOSET',
        supplier: 'Corporate Style Ltda',
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
        createdAt: new Date('2024-12-05'),
        updatedAt: new Date('2025-01-14'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Preto', quantity: 1, soldQuantity: 0 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Cinza', quantity: 1, soldQuantity: 0 }
        ]
      },
      // 7. Shorts Jeans - 3 variações
      {
        id: 'demo-CL-6',
        code: 'SHO-006',
        name: 'Shorts Jeans',
        description: 'Shorts jeans com corte moderno',
        category: 'Shorts',
        brand: 'J&A CLOSET',
        supplier: 'Moda & Estilo Ltda',
        costPrice: 32.00,
        freightPerUnit: 3.20,
        packagingCost: 1.30,
        baseCost: 36.50,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.28,
        salePrice: 69.90,
        sellingPrice: 69.90,
        profit: 32.12,
        status: 'available',
        createdAt: new Date('2024-12-06'),
        updatedAt: new Date('2025-01-15'),
        variations: [
          { id: 'v1', size: { label: '38', value: '38' }, color: 'Azul', quantity: 0, soldQuantity: 2 },
          { id: 'v2', size: { label: '40', value: '40' }, color: 'Preto', quantity: 0, soldQuantity: 1 },
          { id: 'v3', size: { label: '42', value: '42' }, color: 'Azul', quantity: 0, soldQuantity: 3 }
        ]
      },
      // 8. Camiseta Polo - 2 variações
      {
        id: 'demo-CL-7',
        code: 'POL-007',
        name: 'Camiseta Polo',
        description: 'Camiseta polo com gola e botões',
        category: 'Camisetas',
        brand: 'J&A CLOSET',
        supplier: 'Moda & Estilo Ltda',
        costPrice: 38.00,
        freightPerUnit: 3.80,
        packagingCost: 1.60,
        baseCost: 43.40,
        creditFeePercent: 3.5,
        creditFeeAmount: 1.52,
        salePrice: 79.90,
        sellingPrice: 79.90,
        profit: 34.98,
        status: 'available',
        createdAt: new Date('2024-12-07'),
        updatedAt: new Date('2025-01-16'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Branco', quantity: 0, soldQuantity: 3 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Azul', quantity: 0, soldQuantity: 2 }
        ]
      },
      // 9. Macacão Jeans - 2 variações
      {
        id: 'demo-CL-11',
        code: 'MAC-011',
        name: 'Macacão Jeans',
        description: 'Macacão jeans com alças ajustáveis',
        category: 'Macacões',
        brand: 'J&A CLOSET',
        supplier: 'Denim Works Indústria',
        costPrice: 68.00,
        freightPerUnit: 6.80,
        packagingCost: 3.20,
        baseCost: 78.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 2.73,
        salePrice: 139.90,
        sellingPrice: 139.90,
        profit: 59.17,
        status: 'available',
        createdAt: new Date('2024-12-11'),
        updatedAt: new Date('2025-01-20'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Azul', quantity: 0, soldQuantity: 2 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Preto', quantity: 0, soldQuantity: 2 }
        ]
      },
      // 10. Vestido de Festa - 2 variações
      {
        id: 'demo-CL-8',
        code: 'VES-008',
        name: 'Vestido de Festa',
        description: 'Vestido elegante para festas e eventos',
        category: 'Vestidos',
        brand: 'J&A CLOSET',
        supplier: 'Party Wear Solutions',
        costPrice: 75.00,
        freightPerUnit: 7.50,
        packagingCost: 3.50,
        baseCost: 86.00,
        creditFeePercent: 3.5,
        creditFeeAmount: 3.01,
        salePrice: 149.90,
        sellingPrice: 149.90,
        profit: 60.89,
        status: 'available',
        createdAt: new Date('2024-12-08'),
        updatedAt: new Date('2025-01-17'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Preto', quantity: 1, soldQuantity: 0 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Dourado', quantity: 1, soldQuantity: 0 }
        ]
      },
      // 11. Vestido Tubinho - 2 variações
      {
        id: 'demo-CL-20',
        code: 'VES-020',
        name: 'Vestido Tubinho',
        description: 'Vestido tubinho com corte clássico',
        category: 'Vestidos',
        brand: 'J&A CLOSET',
        supplier: 'Moda & Estilo Ltda',
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
        updatedAt: new Date('2025-01-29'),
        variations: [
          { id: 'v1', size: { label: 'M', value: 'M' }, color: 'Preto', quantity: 0, soldQuantity: 2 },
          { id: 'v2', size: { label: 'G', value: 'G' }, color: 'Vermelho', quantity: 0, soldQuantity: 2 }
        ]
      }
    ];
  }

  if (collectionName === 'sales') {
    return [
      // Venda 1 - Paolla Oliveira (Paga)
      {
        id: 'demo-SALE-1',
        customerName: 'Paolla Oliveira',
        customerPhone: '(11) 99999-1111',
        items: [
          {
            clothingItemId: 'demo-CL-1',
            clothingItemCode: 'BLU-001',
            clothingItemName: 'Blusa Básica',
            variationId: 'v1',
            size: 'M',
            color: 'Branco',
            quantity: 1,
            unitPrice: 59.90,
            totalPrice: 59.90
          },
          {
            clothingItemId: 'demo-CL-1',
            clothingItemCode: 'BLU-001',
            clothingItemName: 'Blusa Básica',
            variationId: 'v2',
            size: 'G',
            color: 'Preto',
            quantity: 1,
            unitPrice: 59.90,
            totalPrice: 59.90
          },
          {
            clothingItemId: 'demo-CL-1',
            clothingItemCode: 'BLU-001',
            clothingItemName: 'Blusa Básica',
            variationId: 'v3',
            size: 'P',
            color: 'Azul',
            quantity: 1,
            unitPrice: 59.90,
            totalPrice: 59.90
          },
          {
            clothingItemId: 'demo-CL-2',
            clothingItemCode: 'CAL-002',
            clothingItemName: 'Calça Jeans Skinny',
            variationId: 'v1',
            size: '38',
            color: 'Azul',
            quantity: 1,
            unitPrice: 89.90,
            totalPrice: 89.90
          },
          {
            clothingItemId: 'demo-CL-2',
            clothingItemCode: 'CAL-002',
            clothingItemName: 'Calça Jeans Skinny',
            variationId: 'v2',
            size: '40',
            color: 'Azul',
            quantity: 1,
            unitPrice: 89.90,
            totalPrice: 89.90
          },
          {
            clothingItemId: 'demo-CL-4',
            clothingItemCode: 'SAI-004',
            clothingItemName: 'Saia Midi Floral',
            variationId: 'v1',
            size: 'M',
            color: 'Branco',
            quantity: 1,
            unitPrice: 79.90,
            totalPrice: 79.90
          },
          {
            clothingItemId: 'demo-CL-4',
            clothingItemCode: 'SAI-004',
            clothingItemName: 'Saia Midi Floral',
            variationId: 'v3',
            size: 'P',
            color: 'Verde',
            quantity: 2,
            unitPrice: 79.90,
            totalPrice: 159.80
          },
          {
            clothingItemId: 'demo-CL-6',
            clothingItemCode: 'SHO-006',
            clothingItemName: 'Shorts Jeans',
            variationId: 'v1',
            size: '38',
            color: 'Azul',
            quantity: 2,
            unitPrice: 69.90,
            totalPrice: 139.80
          },
          {
            clothingItemId: 'demo-CL-6',
            clothingItemCode: 'SHO-006',
            clothingItemName: 'Shorts Jeans',
            variationId: 'v3',
            size: '42',
            color: 'Azul',
            quantity: 1,
            unitPrice: 69.90,
            totalPrice: 69.90
          },
          {
            clothingItemId: 'demo-CL-20',
            clothingItemCode: 'VES-020',
            clothingItemName: 'Vestido Tubinho',
            variationId: 'v1',
            size: 'M',
            color: 'Preto',
            quantity: 1,
            unitPrice: 89.90,
            totalPrice: 89.90
          },
          {
            clothingItemId: 'demo-CL-20',
            clothingItemCode: 'VES-020',
            clothingItemName: 'Vestido Tubinho',
            variationId: 'v2',
            size: 'G',
            color: 'Vermelho',
            quantity: 2,
            unitPrice: 89.90,
            totalPrice: 179.80
          }
        ],
        discount: 0,
        discountType: 'percentual',
        total: 1067.60,
        paymentMethod: 'dinheiro',
        status: 'pago',
        notes: 'Cliente satisfeita com a qualidade',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      },
      // Venda 2 - Taís Araújo (Paga)
      {
        id: 'demo-SALE-2',
        customerName: 'Taís Araújo',
        customerPhone: '(11) 99999-2222',
        items: [
          {
            clothingItemId: 'demo-CL-1',
            clothingItemCode: 'BLU-001',
            clothingItemName: 'Blusa Básica',
            variationId: 'v1',
            size: 'M',
            color: 'Branco',
            quantity: 1,
            unitPrice: 59.90,
            totalPrice: 59.90
          },
          {
            clothingItemId: 'demo-CL-1',
            clothingItemCode: 'BLU-001',
            clothingItemName: 'Blusa Básica',
            variationId: 'v3',
            size: 'P',
            color: 'Azul',
            quantity: 1,
            unitPrice: 59.90,
            totalPrice: 59.90
          },
          {
            clothingItemId: 'demo-CL-2',
            clothingItemCode: 'CAL-002',
            clothingItemName: 'Calça Jeans Skinny',
            variationId: 'v3',
            size: '42',
            color: 'Preto',
            quantity: 1,
            unitPrice: 89.90,
            totalPrice: 89.90
          },
          {
            clothingItemId: 'demo-CL-4',
            clothingItemCode: 'SAI-004',
            clothingItemName: 'Saia Midi Floral',
            variationId: 'v1',
            size: 'M',
            color: 'Branco',
            quantity: 1,
            unitPrice: 79.90,
            totalPrice: 79.90
          },
          {
            clothingItemId: 'demo-CL-4',
            clothingItemCode: 'SAI-004',
            clothingItemName: 'Saia Midi Floral',
            variationId: 'v3',
            size: 'P',
            color: 'Verde',
            quantity: 2,
            unitPrice: 79.90,
            totalPrice: 159.80
          },
          {
            clothingItemId: 'demo-CL-6',
            clothingItemCode: 'SHO-006',
            clothingItemName: 'Shorts Jeans',
            variationId: 'v3',
            size: '42',
            color: 'Azul',
            quantity: 2,
            unitPrice: 69.90,
            totalPrice: 139.80
          },
          {
            clothingItemId: 'demo-CL-6',
            clothingItemCode: 'SHO-006',
            clothingItemName: 'Shorts Jeans',
            variationId: 'v2',
            size: '40',
            color: 'Preto',
            quantity: 1,
            unitPrice: 69.90,
            totalPrice: 69.90
          },
          {
            clothingItemId: 'demo-CL-20',
            clothingItemCode: 'VES-020',
            clothingItemName: 'Vestido Tubinho',
            variationId: 'v1',
            size: 'M',
            color: 'Preto',
            quantity: 1,
            unitPrice: 89.90,
            totalPrice: 89.90
          }
        ],
        discount: 0,
        discountType: 'percentual',
        total: 748.00,
        paymentMethod: 'cartao',
        status: 'pago',
        notes: 'Compra para presente',
        createdAt: new Date('2025-01-18'),
        updatedAt: new Date('2025-01-18')
      },
      // Venda 3 - Bruna Marquezine (Paga)
      {
        id: 'demo-SALE-3',
        customerName: 'Bruna Marquezine',
        customerPhone: '(11) 99999-3333',
        items: [
          {
            clothingItemId: 'demo-CL-1',
            clothingItemCode: 'BLU-001',
            clothingItemName: 'Blusa Básica',
            variationId: 'v2',
            size: 'G',
            color: 'Preto',
            quantity: 1,
            unitPrice: 59.90,
            totalPrice: 59.90
          },
          {
            clothingItemId: 'demo-CL-9',
            clothingItemCode: 'CAL-009',
            clothingItemName: 'Calça Social',
            variationId: 'v3',
            size: '42',
            color: 'Azul',
            quantity: 2,
            unitPrice: 99.90,
            totalPrice: 199.80
          },
          {
            clothingItemId: 'demo-CL-13',
            clothingItemCode: 'SAI-013',
            clothingItemName: 'Saia Longa',
            variationId: 'v1',
            size: 'M',
            color: 'Multicolor',
            quantity: 1,
            unitPrice: 99.90,
            totalPrice: 99.90
          },
          {
            clothingItemId: 'demo-CL-13',
            clothingItemCode: 'SAI-013',
            clothingItemName: 'Saia Longa',
            variationId: 'v2',
            size: 'G',
            color: 'Azul',
            quantity: 1,
            unitPrice: 99.90,
            totalPrice: 99.90
          },
          {
            clothingItemId: 'demo-CL-7',
            clothingItemCode: 'POL-007',
            clothingItemName: 'Camiseta Polo',
            variationId: 'v1',
            size: 'M',
            color: 'Branco',
            quantity: 2,
            unitPrice: 79.90,
            totalPrice: 159.80
          },
          {
            clothingItemId: 'demo-CL-7',
            clothingItemCode: 'POL-007',
            clothingItemName: 'Camiseta Polo',
            variationId: 'v2',
            size: 'G',
            color: 'Azul',
            quantity: 1,
            unitPrice: 79.90,
            totalPrice: 79.90
          }
        ],
        discount: 0,
        discountType: 'percentual',
        total: 699.20,
        paymentMethod: 'pix',
        status: 'pago',
        notes: 'Compra para evento especial',
        createdAt: new Date('2025-01-25'),
        updatedAt: new Date('2025-01-25')
      },
      // Venda 4 - Tatá Werneck (Paga)
      {
        id: 'demo-SALE-4',
        customerName: 'Tatá Werneck',
        customerPhone: '(11) 99999-4444',
        items: [
          {
            clothingItemId: 'demo-CL-7',
            clothingItemCode: 'POL-007',
            clothingItemName: 'Camiseta Polo',
            variationId: 'v1',
            size: 'M',
            color: 'Branco',
            quantity: 2,
            unitPrice: 79.90,
            totalPrice: 159.80
          },
          {
            clothingItemId: 'demo-CL-7',
            clothingItemCode: 'POL-007',
            clothingItemName: 'Camiseta Polo',
            variationId: 'v2',
            size: 'G',
            color: 'Azul',
            quantity: 1,
            unitPrice: 79.90,
            totalPrice: 79.90
          }
        ],
        discount: 0,
        discountType: 'percentual',
        total: 239.70,
        paymentMethod: 'cartao',
        status: 'pago',
        notes: 'Cliente frequente',
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01')
      },
      // Venda 5 - Gisele Bündchen (Pendente)
      {
        id: 'demo-SALE-5',
        customerName: 'Gisele Bündchen',
        customerPhone: '(11) 99999-5555',
        items: [
          {
            clothingItemId: 'demo-CL-11',
            clothingItemCode: 'MAC-011',
            clothingItemName: 'Macacão Jeans',
            variationId: 'v1',
            size: 'M',
            color: 'Azul',
            quantity: 1,
            unitPrice: 139.90,
            totalPrice: 139.90
          },
          {
            clothingItemId: 'demo-CL-11',
            clothingItemCode: 'MAC-011',
            clothingItemName: 'Macacão Jeans',
            variationId: 'v2',
            size: 'G',
            color: 'Preto',
            quantity: 1,
            unitPrice: 139.90,
            totalPrice: 139.90
          }
        ],
        discount: 0,
        discountType: 'percentual',
        total: 279.80,
        paymentMethod: 'pix',
        status: 'pendente',
        notes: 'Aguardando pagamento',
        createdAt: new Date('2025-02-03'),
        updatedAt: new Date('2025-02-03')
      },
      // Venda 6 - Virginia Fonseca (Pendente)
      {
        id: 'demo-SALE-6',
        customerName: 'Virginia Fonseca',
        customerPhone: '(11) 99999-6666',
        items: [
          {
            clothingItemId: 'demo-CL-11',
            clothingItemCode: 'MAC-011',
            clothingItemName: 'Macacão Jeans',
            variationId: 'v1',
            size: 'M',
            color: 'Azul',
            quantity: 1,
            unitPrice: 139.90,
            totalPrice: 139.90
          },
          {
            clothingItemId: 'demo-CL-11',
            clothingItemCode: 'MAC-011',
            clothingItemName: 'Macacão Jeans',
            variationId: 'v2',
            size: 'G',
            color: 'Preto',
            quantity: 1,
            unitPrice: 139.90,
            totalPrice: 139.90
          }
        ],
        discount: 0,
        discountType: 'percentual',
        total: 279.80,
        paymentMethod: 'dinheiro',
        status: 'pendente',
        notes: 'Cliente vai buscar amanhã',
        createdAt: new Date('2025-02-05'),
        updatedAt: new Date('2025-02-05')
      }
    ];
  }

  if (collectionName === 'fluxo') {
    return [
      {
        id: 'demo-FLUXO-1',
        data: new Date('2025-02-01'),
        descricao: 'Reinvestimento em novas peças',
        tipo: 'saida',
        origem: 'caixa',
        suborigem: 'reinvestimento',
        valor: 1000.00,
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01')
      },
      {
        id: 'demo-FLUXO-2',
        data: new Date('2025-02-02'),
        descricao: 'Recarga de crédito para celular',
        tipo: 'saida',
        origem: 'caixa',
        suborigem: 'caixa_loja',
        valor: 50.00,
        createdAt: new Date('2025-02-02'),
        updatedAt: new Date('2025-02-02')
      },
      {
        id: 'demo-FLUXO-3',
        data: new Date('2025-02-03'),
        descricao: 'Pagamento de salário',
        tipo: 'saida',
        origem: 'caixa',
        suborigem: 'salario',
        valor: 500.00,
        createdAt: new Date('2025-02-03'),
        updatedAt: new Date('2025-02-03')
      },
      {
        id: 'demo-FLUXO-4',
        data: new Date('2025-02-04'),
        descricao: 'Compra de embalagem',
        tipo: 'saida',
        origem: 'embalagem',
        valor: 50.00,
        createdAt: new Date('2025-02-04'),
        updatedAt: new Date('2025-02-04')
      }
    ];
  }

  if (collectionName === 'notes') {
    return [
      {
        id: 'note-1',
        title: 'Campanha: Liquidar Blazers Executivos',
        content: 'Temos 2 Blazers Executivos (M-Preto e G-Cinza) que não foram vendidos. Criar campanha de desconto de 20% para clientes corporativos. Enviar mensagem para clientes que compraram calças sociais.',
        type: 'campanha',
        priority: 'alta',
        status: 'aberto',
        relatedTab: 'inventory',
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01')
      },
      {
        id: 'note-2',
        title: 'Cliente VIP: Paolla Oliveira',
        content: 'Paolla comprou R$ 1.067,60 em uma única compra (14 peças). É nossa maior cliente! Oferecer desconto de 15% na próxima compra e convidar para preview de nova coleção.',
        type: 'cliente',
        priority: 'alta',
        status: 'aberto',
        relatedTab: 'sales',
        createdAt: new Date('2025-01-16'),
        updatedAt: new Date('2025-01-16')
      },
      {
        id: 'note-3',
        title: 'Lembrete: Repor Estoque de Shorts',
        content: 'Shorts Jeans esgotaram completamente (6 peças vendidas). Verificar com fornecedor disponibilidade para reposição. Considerar aumentar pedido para próxima temporada.',
        type: 'lembrete',
        priority: 'media',
        status: 'aberto',
        relatedTab: 'inventory',
        createdAt: new Date('2025-02-02'),
        updatedAt: new Date('2025-02-02')
      },
      {
        id: 'note-4',
        title: 'Estratégia: Foco em Vestidos de Festa',
        content: 'Vestidos de Festa têm boa rotatividade (2 vendidos). Criar campanha para Dia das Mães com desconto progressivo: 10% para 1 peça, 15% para 2 peças. Preparar material promocional.',
        type: 'estrategia',
        priority: 'media',
        status: 'aberto',
        relatedTab: 'inventory',
        createdAt: new Date('2025-01-28'),
        updatedAt: new Date('2025-01-28')
      },
      {
        id: 'note-5',
        title: 'Cliente Frequente: Tatá Werneck',
        content: 'Tatá já fez 2 compras este mês (R$ 239,70). Oferecer programa de fidelidade: a cada 3 compras, ganha 1 peça grátis até R$ 100. Enviar convite para programa VIP.',
        type: 'cliente',
        priority: 'media',
        status: 'aberto',
        relatedTab: 'sales',
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01')
      },
      {
        id: 'note-6',
        title: 'Lembrete: Cobrar Vendas Pendentes',
        content: 'Gisele Bündchen e Virginia Fonseca têm vendas pendentes (R$ 279,80 cada). Lembrar de cobrar até sexta-feira. Se não pagarem, liberar peças para outros clientes.',
        type: 'lembrete',
        priority: 'alta',
        status: 'aberto',
        relatedTab: 'sales',
        createdAt: new Date('2025-02-05'),
        updatedAt: new Date('2025-02-05')
      },
      {
        id: 'note-7',
        title: 'Análise: Saia Midi Floral',
        content: 'Saia Midi Floral teve boa performance (5 vendidas). Considerar aumentar estoque desta peça. Clientes gostaram das cores Branco e Verde. Manter essas opções.',
        type: 'analise',
        priority: 'baixa',
        status: 'resolvido',
        relatedTab: 'inventory',
        createdAt: new Date('2025-01-30'),
        updatedAt: new Date('2025-01-30')
      },
      {
        id: 'note-8',
        title: 'Ideia: Kit de Presente',
        content: 'Criar kits de presente com Blusa Básica + Calça Social. Preço especial R$ 199,90 (economia de R$ 40). Ideal para Dia das Mães. Preparar embalagem especial.',
        type: 'ideia',
        priority: 'baixa',
        status: 'aberto',
        relatedTab: 'inventory',
        createdAt: new Date('2025-02-03'),
        updatedAt: new Date('2025-02-03')
      }
    ];
  }

  if (collectionName === 'investments') {
  return [];
}

  return [];
}

// Hook para gerenciar usuários - FIREBASE ONLY
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Função auxiliar para converter timestamps
      const convertTimestamps = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (obj && typeof obj === 'object' && obj.toDate) {
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
      
      // Buscar usuários do Firebase
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      
      const querySnapshot = await getDocs(collection(db, 'users'));
      const firebaseUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = convertTimestamps(doc.data());
        firebaseUsers.push({
          id: doc.id,
          ...data
        } as User);
      });
      setUsers(firebaseUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      // Atualizar no Firebase
      const { db } = await import('../config/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', id), {
        ...(updates as any),
        updatedAt: new Date()
      });
      
      // Invalidar cache de usuários no localStorage (forçar recarregar do Firebase)
      try {
        localStorage.removeItem('JEACLOSET_cache_users');
        localStorage.removeItem('JEACLOSET_cache_time_users');
      } catch (e) {
        // Ignorar erros
      }
      
      // Atualizar estado local
      setUsers(prev => prev.map(user => 
        user.id === id ? { ...user, ...updates, updatedAt: new Date() } : user
      ));
      
      // Recarregar usuários do Firebase para garantir sincronização
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
      throw err;
    }
  };

  const createUser = async (user: Omit<User, 'id'>) => {
    try {
      // Criar no Firebase
      const { db } = await import('../config/firebase');
      const { collection, addDoc } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'users'), {
        ...(user as any),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const newUser: User = {
        ...user,
        id: docRef.id,
        createdAt: new Date()
      };
      
      // Atualizar estado local
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário');
      return null;
    }
  };

  const getUserByEmail = async (email: string): Promise<User | null> => {
    try {
      // Função auxiliar para converter timestamps (definida localmente)
      const convertTimestamps = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (obj && typeof obj === 'object' && obj.toDate) {
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
      
      // Buscar no Firebase (case-insensitive)
      const { db } = await import('../config/firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      
      // Buscar todos os usuários e filtrar por email (case-insensitive)
      // Isso resolve o problema de case-sensitive do Firestore
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      const emailLower = email.toLowerCase();
      
      for (const doc of allUsersSnapshot.docs) {
        const userData = doc.data();
        if (userData.email?.toLowerCase() === emailLower) {
          const data = convertTimestamps(userData);
          return {
            id: doc.id,
            ...data
          } as User;
        }
      }
      
      return null;
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      return null;
    }
  };

  // Função para buscar usuário por nome ou email (usada no login)
  const getUserByLogin = async (login: string): Promise<User | null> => {
    try {
      // Função auxiliar para converter timestamps
      const convertTimestamps = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (obj && typeof obj === 'object' && obj.toDate) {
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
      
      // Buscar no Firebase
      const { db } = await import('../config/firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      
      // Buscar todos os usuários
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      const loginLower = login.toLowerCase();
      
      // Buscar por nome OU email (case-insensitive)
      for (const doc of allUsersSnapshot.docs) {
        const userData = doc.data();
        const userNameLower = userData.name?.toLowerCase() || '';
        const userEmailLower = userData.email?.toLowerCase() || '';
        
        // Verificar se o login corresponde ao nome OU ao email
        if (userNameLower === loginLower || userEmailLower === loginLower) {
          const data = convertTimestamps(userData);
          return {
            id: doc.id,
            ...data
          } as User;
        }
      }
      
      return null;
    } catch (err) {
      console.error('Erro ao buscar usuário por login:', err);
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
    getUserByEmail,
    getUserByLogin
  };
};

// Hook principal para gerenciar dados
export const useFirestore = <T extends any>(collectionName: string) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper: detect viewer role (login test) from localStorage
  const isViewerRole = () => {
    try {
      const user = localStorage.getItem('JEACLOSET_user');
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.role === 'viewer';
      }
      return false;
    } catch {
      return false;
    }
  };

  // Converter Timestamp do Firebase para Date
  const convertTimestamps = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj && typeof obj === 'object' && obj.toDate) {
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

  const loadData = async () => {
    // Verificar cache primeiro (últimos 5 segundos)
    const cacheKey = `JEACLOSET_cache_${collectionName}`;
    const cacheTimeKey = `JEACLOSET_cache_time_${collectionName}`;
    
    try {
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheTimeKey);
      const now = Date.now();
      
      // Se tem cache válido (menos de 5 segundos), usar
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 5000) {
        try {
          const parsed = JSON.parse(cachedData);
          setData(parsed as T[]);
          setLoading(false);
          return; // Retornar sem fazer query ao Firebase
        } catch (e) {
          // Se cache corrompido, continuar normalmente
        }
      }
    } catch (e) {
      // Ignorar erros de cache
    }

    setLoading(true);
    setError(null);
    
    try {
      // Verificar se é visualizador (login test)
      if (isViewerRole()) {
        // Para login test: usar dados demo
        const demoData = getDemoData(collectionName);
        setData(demoData as T[]);
        setLoading(false);
        return;
      }
      
      // Para admin/usuário: carregar dados reais do Firebase com timeout
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('../config/firebase');
        
        // Verificar se db está disponível
        if (!db) {
          throw new Error('Firebase não está inicializado');
        }
        
        // Criar promise com timeout de 5 segundos (reduzido)
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Firebase não respondeu a tempo')), 5000)
        );
        
        const queryPromise = getDocs(collection(db, collectionName)).then(querySnapshot => {
          const firebaseData: T[] = [];
          querySnapshot.forEach((doc) => {
            firebaseData.push({
              id: doc.id,
              ...convertTimestamps(doc.data())
            } as T);
          });
          return firebaseData;
        }).catch((err: any) => {
          // Erros comuns do Firebase
          if (err?.code === 'permission-denied' || err?.code === 'unavailable') {
            throw new Error('Firebase não disponível - usando modo offline');
          }
          throw err;
        });
        
        // Race entre query e timeout
        const firebaseData = await Promise.race([queryPromise, timeoutPromise]);
        
        // Salvar no cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify(firebaseData));
          localStorage.setItem(cacheTimeKey, Date.now().toString());
        } catch (e) {
          // Ignorar erros de localStorage
        }
        
        setData(firebaseData);
      } catch (firebaseError: any) {
        console.warn('⚠️ Firebase não disponível:', firebaseError.message);
        
        // Tentar usar cache mesmo que antigo em caso de erro
        try {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            setData(parsed as T[]);
            // Não mostrar erro se tiver cache - apenas usar silenciosamente
            setError(null);
            return;
          }
        } catch (e) {
          // Ignorar erro de parse
        }
        
        // Se não tem cache, usar array vazio (não mostrar erro para não assustar usuário)
        setData([]);
        setError(null); // Não mostrar erro na UI - funciona em modo offline
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = () => {
    try {
      localStorage.removeItem(`JEACLOSET_cache_${collectionName}`);
      localStorage.removeItem(`JEACLOSET_cache_time_${collectionName}`);
    } catch (e) {
      // Ignorar erros
    }
  };

  const add = async (item: Omit<T, 'id'>) => {
    try {
      // Viewer: apenas local
      if (isViewerRole()) {
        const newItem = {
          ...item,
          id: `${collectionName}-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        } as T;
        setData(prev => [...prev, newItem]);
        return newItem;
      }

      // Admin/Usuário: persistir no Firebase
      const { db } = await import('../config/firebase');
      const { collection, addDoc } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, collectionName), {
        ...(item as any),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const created = { ...(item as any), id: docRef.id } as T;
      setData(prev => [...prev, created]);
      invalidateCache(); // Invalidar cache após adicionar
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar item');
      return null;
    }
  };

  const update = async (id: string, updates: Partial<T>) => {
    try {
      // Viewer: apenas local
      if (isViewerRole()) {
        setData(prev => prev.map(item => {
          if ((item as any).id === id) {
            const updatedItem = { ...(item as any), ...updates };
            if (collectionName !== 'users') {
              (updatedItem as any).updatedAt = new Date();
            }
            return updatedItem;
          }
          return item;
        }));
        return;
      }

      // Admin/Usuário: persistir no Firebase e refletir localmente
      const { db } = await import('../config/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, collectionName, id), {
        ...(updates as any),
        updatedAt: new Date()
      });

      setData(prev => prev.map(item => ((item as any).id === id ? { ...(item as any), ...updates, updatedAt: new Date() } : item)));
      invalidateCache(); // Invalidar cache após atualizar
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar item');
    }
  };

  const remove = async (id: string) => {
    try {
      // Viewer: apenas local
      if (isViewerRole()) {
        setData(prev => prev.filter(item => (item as any).id !== id));
        return;
      }

      // Admin/Usuário: remover do Firebase e do estado
      const { db } = await import('../config/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, collectionName, id));
      setData(prev => prev.filter(item => (item as any).id !== id));
      invalidateCache(); // Invalidar cache após remover
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover item');
    }
  };

  useEffect(() => {
    // Usar uma pequena debounce para evitar chamadas simultâneas múltiplas
    const timer = setTimeout(() => {
      loadData();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [collectionName]);

  return {
    data,
    loading,
    error,
    add,
    update,
    remove,
    loadData,
    initialized: !loading
  };
};