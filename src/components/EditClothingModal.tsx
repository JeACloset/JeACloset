import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, AlertCircle } from 'lucide-react';
import type { ClothingItem, ClothingCategory } from '../types';
import { useFirestore } from '../hooks/useFirestore';

interface EditClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ClothingItem | null;
  onSuccess: () => void;
}

export default function EditClothingModal({ isOpen, onClose, item, onSuccess }: EditClothingModalProps) {
  const { update } = useFirestore<ClothingItem>('clothing');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '' as ClothingCategory,
    brand: '',
    supplier: '',
    costPrice: 0,
    sellingPrice: 0,
    packagingCost: 0,
    profitMargin: 0,
    status: 'available' as 'available' | 'sold',
    tags: [] as string[],
    variations: [] as Array<{
      size: string;
      color: string;
      quantity: number;
      soldQuantity: number;
    }>
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories: ClothingCategory[] = [
    'Blusas', 'Camisetas', 'Vestidos', 'Calças', 'Shorts', 'Saias',
    'Jaquetas', 'Blazers', 'Casacos', 'Outros'
  ];

  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        code: item.code || '',
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'Outros',
        brand: item.brand || '',
        supplier: item.supplier || '',
        costPrice: item.costPrice || 0,
        sellingPrice: item.sellingPrice || 0,
        packagingCost: item.packagingCost || 0,
        profitMargin: item.profitMargin || 0,
        status: (item.status === 'reserved' ? 'available' : item.status) || 'available',
        tags: item.tags || [],
        variations: (item.variations || []).map(v => ({
          size: typeof v.size === 'string' ? v.size : v.size.value,
          color: v.color,
          quantity: v.quantity,
          soldQuantity: (v as any).soldQuantity || 0
        }))
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setLoading(true);
    setError('');

    try {
      // Calcular margem de lucro
      const totalCost = formData.costPrice + formData.packagingCost;
      const calculatedProfitMargin = formData.sellingPrice > 0 ? 
        ((formData.sellingPrice - totalCost) / formData.sellingPrice) * 100 : 0;

      const updatedItem = {
        ...formData,
        profitMargin: calculatedProfitMargin,
        updatedAt: new Date().toISOString()
      };

       // Ensure variations have the required 'id' property for update
       const updatedItemWithIds = {
         ...updatedItem,
         variations: (formData.variations || []).map((v, idx) => {
           const originalVariation = item.variations?.[idx];
           return {
             id: originalVariation?.id ?? `var_${Date.now()}_${idx}`,
             size: {
               type: 'custom' as const,
               value: v.size,
               displayName: v.size
             },
             color: v.color,
             quantity: v.quantity,
             soldQuantity: originalVariation?.soldQuantity || 0
           };
         }),
         updatedAt: new Date() // Use Date object, not string
       };

      await update(item.id, updatedItemWithIds);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao atualizar peça. Tente novamente.');
      console.error('Erro ao atualizar peça:', err);
    } finally {
      setLoading(false);
    }
  };

  const addVariation = () => {
    setFormData(prev => ({
      ...prev,
      variations: [...prev.variations, { size: '', color: '', quantity: 0, soldQuantity: 0 }]
    }));
  };

  const updateVariation = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((variation, i) => 
        i === index ? { ...variation, [field]: value } : variation
      )
    }));
  };

  const removeVariation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen || !item) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Editar Peça</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ClothingCategory }))}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fornecedor</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preço de Custo</label>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preço de Venda</label>
              <input
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custo de Embalagem</label>
              <input
                type="number"
                step="0.01"
                value={formData.packagingCost}
                onChange={(e) => setFormData(prev => ({ ...prev, packagingCost: parseFloat(e.target.value) || 0 }))}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Variações */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Variações</h4>
              <button
                type="button"
                onClick={addVariation}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Adicionar Variação
              </button>
            </div>

            <div className="space-y-4">
              {formData.variations.map((variation, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
                    <input
                      type="text"
                      value={variation.size}
                      onChange={(e) => updateVariation(index, 'size', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Ex: P, M, G"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                    <input
                      type="text"
                      value={variation.color}
                      onChange={(e) => updateVariation(index, 'color', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Ex: Azul, Vermelho"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                    <input
                      type="number"
                      value={variation.quantity}
                      onChange={(e) => updateVariation(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      min="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeVariation(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Usar React Portal para renderizar fora da árvore DOM principal
  return createPortal(modalContent, document.body);
}
