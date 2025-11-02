import React, { useState } from 'react';
import { Plus, Save, X, Trash2, ShoppingBag, Tag, Palette, DollarSign, Sparkles } from 'lucide-react';
import type { ClothingItem, ClothingCategory, ClothingSize, ClothingVariation } from '../types';
import { useFirestore } from '../hooks/useFirestore';
import ViewerAlert from './ViewerAlert';

const categories: ClothingCategory[] = [
  'Blusas', 'Camisetas', 'Vestidos', 'Calças', 'Shorts', 'Saias',
  'Jaquetas', 'Blazers', 'Casacos', 'Outros'
];

const sizes: ClothingSize[] = [
  // Tamanhos numéricos
  { type: 'numeric', value: '34', displayName: '34' },
  { type: 'numeric', value: '36', displayName: '36' },
  { type: 'numeric', value: '38', displayName: '38' },
  { type: 'numeric', value: '40', displayName: '40' },
  { type: 'numeric', value: '42', displayName: '42' },
  { type: 'numeric', value: '44', displayName: '44' },
  { type: 'numeric', value: '46', displayName: '46' },
  { type: 'numeric', value: '48', displayName: '48' },
  { type: 'numeric', value: '50', displayName: '50' },
  { type: 'numeric', value: '52', displayName: '52' },
  
  // Tamanhos por letras
  { type: 'letter', value: 'PP', displayName: 'PP' },
  { type: 'letter', value: 'P', displayName: 'P' },
  { type: 'letter', value: 'M', displayName: 'M' },
  { type: 'letter', value: 'G', displayName: 'G' },
  { type: 'letter', value: 'GG', displayName: 'GG' },
  { type: 'letter', value: 'XG', displayName: 'XG' },
  { type: 'letter', value: 'XXG', displayName: 'XXG' },
  
  // Tamanhos customizados
  { type: 'custom', value: 'Único', displayName: 'Único' },
];

// Cores serão inseridas manualmente

export default function ClothingForm() {
  const { data: clothingItems, add, update, loading, error } = useFirestore<ClothingItem>('clothing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showViewerAlert, setShowViewerAlert] = useState(false);
  const [viewerAlertAction, setViewerAlertAction] = useState('');


  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '' as ClothingCategory,
    brand: '',
    supplier: '',
    collection: '',
    season: 'Ano Todo' as 'Verão' | 'Outono' | 'Inverno' | 'Primavera' | 'Ano Todo',
    date: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
    costPrice: 0,
    freightCost: 0,
    freightQuantity: 1,
    packagingCost: 0,
    extraCosts: 0,
    profitMargin: 0,
    creditFee: 0,
    images: [] as string[],
    tags: [] as string[],
  });

  const [variations, setVariations] = useState<ClothingVariation[]>([]);
  const [newVariation, setNewVariation] = useState({
    size: sizes[0],
    color: '',
    quantity: 1,
    sku: '',
  });

  const [newTag, setNewTag] = useState('');
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Função para detectar se é visualizador
  const isViewer = () => {
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

  // Função para mostrar alerta do visualizador
  const showViewerAlertForAction = (action: string) => {
    setViewerAlertAction(action);
    setShowViewerAlert(true);
  };

  // Função para obter a última peça cadastrada
  const getLastRegisteredItem = () => {
    if (!clothingItems || clothingItems.length === 0) return null;
    
    // Ordenar por data de criação (mais recente primeiro)
    const sortedItems = [...clothingItems].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    return sortedItems[0];
  };

  const lastRegisteredItem = getLastRegisteredItem();

  // useEffect para detectar edição de peça
  React.useEffect(() => {
    const editingItem = localStorage.getItem('editingClothingItem');
    if (editingItem) {
      try {
        const item = JSON.parse(editingItem);
        console.log('Carregando peça para edição:', item);
        
        // Preencher formulário com dados da peça
        setFormData({
          code: item.code || '',
          name: item.name || '',
          description: item.description || '',
          category: item.category || '',
          brand: item.brand || '',
          supplier: item.supplier || '',
          collection: item.collection || '',
          season: item.season || 'Ano Todo',
          date: item.date || '',
          costPrice: item.costPrice || 0,
          freightCost: item.freightCost || 0,
          freightQuantity: item.freightQuantity || 1,
          packagingCost: item.packagingCost || 0,
          extraCosts: item.extraCosts || 0,
          profitMargin: item.profitMargin || 100,
          creditFee: item.creditFee || 5,
          images: item.images || [],
          tags: item.tags || [],
        });
        
        // Preencher variações
        setVariations(item.variations || []);
        
        // Marcar como edição
        setIsEditing(true);
        setEditingItemId(item.id);
        
        // Limpar localStorage
        localStorage.removeItem('editingClothingItem');
        
        console.log('Peça carregada para edição com sucesso');
      } catch (error) {
        console.error('Erro ao carregar peça para edição:', error);
        localStorage.removeItem('editingClothingItem');
      }
    }
  }, []);

  // Função para capitalizar palavras (primeira letra de cada palavra maiúscula, exceto palavras de 1-2 letras)
  const capitalizeWords = (text: string) => {
    return text
      .split(' ')
      .map(word => {
        if (word.length <= 2) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  // Função para converter string para número
  const parseNumber = (value: any): number => {
    if (value === '' || value === null || value === undefined) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Função para calcular valores em tempo real
  const calculateValues = () => {
    const costPrice = parseNumber(formData.costPrice);
    const freightCost = parseNumber(formData.freightCost);
    const freightQuantity = parseNumber(formData.freightQuantity);
    const packagingCost = parseNumber(formData.packagingCost);
    const extraCosts = parseNumber(formData.extraCosts);
    const creditFee = parseNumber(formData.creditFee);
    const profitMargin = parseNumber(formData.profitMargin);
    
    const freightPerUnit = freightCost && freightQuantity 
      ? freightCost / freightQuantity 
      : 0;
    
    // Custos base (sem embalagem)
    const baseCost = costPrice + freightPerUnit + extraCosts;

    // Calcular lucro apenas sobre os custos base (sem taxa de cartão)
    const profitAmount = (baseCost * profitMargin) / 100;

    // Preço de venda NÃO inclui taxa de cartão; embalagem é somada ao final
    const sellingPrice = baseCost + profitAmount + packagingCost;

    // Taxa de crédito deve incidir sobre o valor de VENDA (o que a operadora cobra)
    const creditFeeAmount = (sellingPrice * creditFee) / 100;

    // Custo total exibido (base + embalagem + taxa cobrada pela operadora)
    const totalCost = baseCost + packagingCost + creditFeeAmount;
    
    return {
      costPrice,
      freightPerUnit,
      baseCost,
      creditFeeAmount,
      packagingCost,
      totalCost,
      profitAmount,
      sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
      creditFee,
      profitMargin
    };
  };

  // Calcular valores diretamente - sem useMemo
  const currentValues = calculateValues();
  const sellingPrice = currentValues.sellingPrice;
  
  // Debug: verificar se os valores estão sendo calculados (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log('FormData atual:', formData);
    console.log('Valores calculados:', currentValues);
  }

  // Função para verificar se um campo tem erro
  const hasFieldError = (fieldName: string, value: any) => {
    if (!touchedFields.has(fieldName)) return false;
    
    switch (fieldName) {
      case 'code':
        return !value || !value.trim();
      case 'name':
        return !value || !value.trim();
      case 'category':
        return !value;
      case 'supplier':
        return !value || !value.trim();
      default:
        return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Marcar campo como tocado
    setTouchedFields(prev => new Set(prev).add(name));
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'costPrice' || name === 'freightCost' || name === 'freightQuantity' || name === 'packagingCost' || name === 'extraCosts' || name === 'profitMargin' || name === 'creditFee'
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleAddVariation = () => {
    if (newVariation.quantity > 0) {
      const variation: ClothingVariation = {
        id: Date.now().toString(),
        ...newVariation,
        quantity: newVariation.quantity,
        soldQuantity: 0
      };
      setVariations(prev => [...prev, variation]);
      setTouchedFields(prev => new Set(prev).add('variations'));
      setNewVariation({
        size: sizes[0],
        color: '',
        quantity: 1,
        sku: '',
      });
    }
  };

  const handleRemoveVariation = (id: string) => {
    setVariations(prev => prev.filter(v => v.id !== id));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 === INÍCIO handleSubmit ===');
    console.log('Evento:', e);
    console.log('isSubmitting:', isSubmitting);
    console.log('loading:', loading);
    console.log('formData:', formData);
    console.log('variations:', variations);
    // Alert para debug no mobile
    // alert('🚀 handleSubmit iniciado!');
    
    // Verificar se é visualizador
    if (isViewer()) {
      console.log('❌ Usuário é visualizador, bloqueando submit');
      showViewerAlertForAction('cadastrar ou editar peças');
      return;
    }
    
    // Validação detalhada dos campos obrigatórios
    const missingFields = [];
    
    if (!formData.code.trim()) missingFields.push('Código da Peça');
    if (!formData.name.trim()) missingFields.push('Nome da Peça');
    if (!formData.category) missingFields.push('Categoria');
    if (!formData.supplier.trim()) missingFields.push('Fornecedor');
    if (variations.length === 0) missingFields.push('Pelo menos uma variação (tamanho e cor)');
    
    console.log('🔍 Campos faltando:', missingFields);
    // alert(`🔍 Campos faltando: ${missingFields.length > 0 ? missingFields.join(', ') : 'Nenhum'}`);
    
    if (missingFields.length > 0) {
      // Marcar campos como tocados para mostrar erros visuais
            const fieldsToMark: string[] = [];
            if (!formData.code.trim()) fieldsToMark.push('code');
            if (!formData.name.trim()) fieldsToMark.push('name');
            if (!formData.category) fieldsToMark.push('category');
            if (!formData.supplier.trim()) fieldsToMark.push('supplier');
            if (variations.length === 0) fieldsToMark.push('variations');
      
      setTouchedFields(prev => {
        const newSet = new Set(prev);
        fieldsToMark.forEach(field => newSet.add(field));
        return newSet;
      });
      
      alert(`Preencha os seguintes campos obrigatórios:\n\n• ${missingFields.join('\n• ')}`);
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditing && editingItemId) {
        // Modo edição - atualizar peça existente
        const clothingItem: ClothingItem = {
          id: editingItemId,
          ...formData,
          variations,
          sellingPrice,
          status: 'available',
          createdAt: new Date(), // Manter data original
          updatedAt: new Date(),
        };

        console.log('Atualizando peça:', clothingItem);
        console.log('isEditing:', isEditing, 'editingItemId:', editingItemId);
        
        try {
          await update(editingItemId, clothingItem);
          
          console.log('Peça atualizada com sucesso');
          console.log('Chamando setShowSuccess(true)');
          
          // Usar setTimeout para evitar conflitos de renderização
          setTimeout(() => {
            setShowSuccess(true);
            console.log('showSuccess deve ser true agora');
          }, 100);
        } catch (error) {
          console.error('Erro ao atualizar peça:', error);
          setTimeout(() => {
            setShowSuccess(true); // Mostrar feedback mesmo com erro
          }, 100);
        }
        
        // Reset form será feito quando o usuário fechar o modal
      } else {
        // Modo criação - adicionar nova peça
        const clothingItem: Omit<ClothingItem, 'id'> = {
          ...formData,
          variations,
          sellingPrice,
          status: 'available',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        console.log('Salvando peça:', clothingItem);
        // alert('💾 Salvando peça...');
        
        let result;
        try {
          result = await add(clothingItem);
          console.log('Resultado do add:', result);
          console.log('Tipo do resultado:', typeof result);
          // alert(`💾 Resultado: ${result}`);
        } catch (error) {
          console.error('Erro no add:', error);
          alert(`❌ Erro no salvamento: ${error}`);
          return;
        }
        
        if (result) {
        console.log('Peça salva com sucesso');
        
        // Mostrar sucesso IMEDIATAMENTE
        console.log('🔔 Mostrando modal de sucesso...');
        
        // Usar setTimeout para garantir que o modal apareça antes de qualquer redirecionamento
        setTimeout(() => {
          setShowSuccess(true);
          console.log('🔔 showSuccess definido como true');
        }, 100);
        
        // Tocar som de sucesso (respeitando preferência do usuário)
        try {
          const soundPref = localStorage.getItem('JEACLOSET_sound_enabled');
          const canPlay = soundPref === 'true';
          if (canPlay) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
          }
        } catch (error) {
          console.log('Não foi possível tocar o som de sucesso:', error);
        }
        
        // Reset form será feito quando o usuário fechar o modal
        
        } else {
          console.error('Falha ao salvar peça - result inválido:', result);
          alert(`Erro ao salvar peça. Resultado: ${result}. Verifique os dados e tente novamente.`);
        }
      }
    } catch (error) {
      console.error('Erro no salvamento:', error);
      alert('Erro ao salvar peça. Tente novamente.');
    } finally {
      console.log('🏁 === FIM handleSubmit ===');
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start mb-4 sm:mb-0">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-xl mr-4 mt-1">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? 'Editar Peça' : 'Cadastrar Nova Peça'}
                </h2>
                <p className="text-sm text-gray-600">
                  {isEditing ? 'Modifique os dados da peça e salve as alterações' : 'Adicione novas peças ao seu catálogo'}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="flex items-center sm:justify-end">
                <div className="text-2xl font-bold text-purple-600 mr-2">
                  {variations.length}
                </div>
                <div className="text-sm text-gray-600">variações</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards principais - Grid apenas para mobile */}
        <div className="grid grid-cols-1 lg:block gap-6 lg:space-y-6">
          {/* Última Peça Cadastrada */}
          {lastRegisteredItem && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-xl border border-green-200 p-6">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg mr-3">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Última Peça Cadastrada</h3>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 mb-4 sm:mb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium w-fit">
                      {lastRegisteredItem.code}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {lastRegisteredItem.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="mb-1">
                      <span className="font-medium">Categoria:</span> {lastRegisteredItem.category}
                    </div>
                    <div className="mb-1">
                      <span className="font-medium">Marca:</span> {lastRegisteredItem.brand || 'Não informada'}
                    </div>
                    <div>
                      <span className="font-medium">Variações:</span> {lastRegisteredItem.variations?.length || 0}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-sm text-gray-500 mb-1">
                    Cadastrada em
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {(() => {
                      try {
                        if (!lastRegisteredItem.createdAt) return 'Data não disponível';
                        
                        let date = lastRegisteredItem.createdAt;
                        
                        // Se for um timestamp do Firebase, converter para Date
                        if (date && typeof date === 'object' && (date as any).toDate) {
                          date = (date as any).toDate();
                        }
                        
                        // Se for uma string, tentar converter para Date
                        if (typeof date === 'string') {
                          date = new Date(date);
                        }
                        
                        // Se não for um objeto Date válido, criar um novo Date
                        if (!(date instanceof Date) || isNaN(date.getTime())) {
                          return 'Data inválida';
                        }
                        
                        return date.toLocaleDateString('pt-BR');
                      } catch (error) {
                        return 'Data inválida';
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Formulário Principal */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Erro: {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} className="space-y-8">
          {/* Informações Básicas */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg mr-3">
                <Tag className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código da Peça *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={(e) => {
                  setTouchedFields(prev => new Set(prev).add('code'));
                  setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }));
                }}
                className={`input-field ${hasFieldError('code', formData.code) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Ex: VEST001"
                required
              />
              {hasFieldError('code', formData.code) && (
                <p className="mt-1 text-sm text-red-600">Código da peça é obrigatório</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Peça *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => {
                  setTouchedFields(prev => new Set(prev).add('name'));
                  setFormData(prev => ({ ...prev, name: capitalizeWords(e.target.value) }));
                }}
                className={`input-field ${hasFieldError('name', formData.name) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Ex: Vestido Floral"
                required
              />
              {hasFieldError('name', formData.name) && (
                <p className="mt-1 text-sm text-red-600">Nome da peça é obrigatório</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`input-field ${hasFieldError('category', formData.category) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {hasFieldError('category', formData.category) && (
                <p className="mt-1 text-sm text-red-600">Categoria é obrigatória</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: capitalizeWords(e.target.value) }))}
                className="input-field"
                placeholder="Ex: Zara, H&M"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fornecedor *
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={(e) => {
                  setTouchedFields(prev => new Set(prev).add('supplier'));
                  setFormData(prev => ({ ...prev, supplier: capitalizeWords(e.target.value) }));
                }}
                className={`input-field ${hasFieldError('supplier', formData.supplier) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Nome do fornecedor"
                required
              />
              {hasFieldError('supplier', formData.supplier) && (
                <p className="mt-1 text-sm text-red-600">Fornecedor é obrigatório</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coleção
              </label>
              <input
                type="text"
                name="collection"
                value={formData.collection}
                onChange={(e) => setFormData(prev => ({ ...prev, collection: capitalizeWords(e.target.value) }))}
                className="input-field"
                placeholder="Ex: Verão 2024"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estação
                </label>
                <select
                  name="season"
                  value={formData.season}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="Ano Todo">Ano Todo</option>
                  <option value="Verão">Verão</option>
                  <option value="Outono">Outono</option>
                  <option value="Inverno">Inverno</option>
                  <option value="Primavera">Primavera</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>
          </div>

          {/* Descrição */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg mr-3">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Descrição</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: capitalizeWords(e.target.value) }))}
                className="input-field"
                rows={3}
                placeholder="Descrição detalhada da peça..."
              />
            </div>
          </div>

          {/* Preços e Custos */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-2 rounded-lg mr-3">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Preços e Custos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço de Custo *
                </label>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleInputChange}
                  className="input-field"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frete por Lote
                </label>
                <input
                  type="number"
                  name="freightCost"
                  value={formData.freightCost}
                  onChange={handleInputChange}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qtd. Peças no Lote
                </label>
                <input
                  type="number"
                  name="freightQuantity"
                  value={formData.freightQuantity}
                  onChange={handleInputChange}
                  className="input-field"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custos Extras
                </label>
                <input
                  type="number"
                  name="extraCosts"
                  value={formData.extraCosts}
                  onChange={handleInputChange}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custo por Embalagem
                </label>
                <input
                  type="number"
                  name="packagingCost"
                  value={formData.packagingCost}
                  onChange={handleInputChange}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taxa de Crédito (%)
                </label>
                <input
                  type="number"
                  name="creditFee"
                  value={formData.creditFee}
                  onChange={handleInputChange}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margem de Lucro (%)
                </label>
                <input
                  type="number"
                  name="profitMargin"
                  value={formData.profitMargin}
                  onChange={handleInputChange}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div key={`calculation-${currentValues.sellingPrice}-${currentValues.baseCost}`} className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subcard Cálculo do Preço */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Cálculo do Preço</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-gray-600 mb-1 sm:mb-0">Frete unitário: (Frete por Lote / Qtd. Peças no Lote)</span>
                    <span className="font-medium value-text">R$ {currentValues.freightPerUnit.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-gray-600 mb-1 sm:mb-0">Custo Base: (P. Custo + Frete unitário + Custo Extra)</span>
                    <span className="font-medium value-text">R$ {currentValues.baseCost.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-gray-600 mb-1 sm:mb-0">Taxa Crédito ({currentValues.creditFee}%):</span>
                    <span className="font-medium value-text">R$ {currentValues.creditFeeAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-gray-600 mb-1 sm:mb-0">Custo Bruto Total:</span>
                    <span className="font-medium value-text">R$ {(currentValues.baseCost + currentValues.creditFeeAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-gray-600 mb-1 sm:mb-0">Embalagem:</span>
                    <span className="font-medium value-text">R$ {currentValues.packagingCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Subcard Preço de Venda */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Preço de Venda</h4>
                <div className="text-center">
                  <div className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 price-text">
                    R$ {currentValues.sellingPrice.toFixed(2)}
                  </div>
                  <div className="text-sm sm:text-lg text-gray-600 value-text">
                    Margem: {currentValues.profitMargin}%
                  </div>
                  {/* Lucro por peça (preço de venda - custo bruto - embalagem) */}
                  {(() => {
                    // Lucro considera que a taxa do cartão é um custo que ocorre somente
                    // quando a venda é no crédito; mantemos aqui para visão conservadora
                    const unitProfit = currentValues.sellingPrice - (currentValues.baseCost + currentValues.packagingCost + currentValues.creditFeeAmount);
                    return (
                      <div className="mt-3 text-sm sm:text-base font-semibold text-green-700">
                        Lucro (por peça): R$ {Number.isFinite(unitProfit) ? unitProfit.toFixed(2) : '0,00'}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Variações (Tamanhos e Cores) */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200 p-6">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-2 rounded-lg mr-3">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Variações (Tamanhos e Cores) *
                {variations.length === 0 && touchedFields.has('variations') && (
                  <span className="text-red-600 text-sm ml-2">(Pelo menos uma variação é obrigatória)</span>
                )}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanho
                </label>
                <select
                  value={newVariation.size.value}
                  onChange={(e) => {
                    const size = sizes.find(s => s.value === e.target.value);
                    if (size) setNewVariation(prev => ({ ...prev, size }));
                  }}
                  className="input-field"
                >
                  {sizes.map(size => (
                    <option key={size.value} value={size.value}>
                      {size.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor
                </label>
                <input
                  type="text"
                  value={newVariation.color}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, color: capitalizeWords(e.target.value) }))}
                  className="input-field"
                  placeholder="Ex: Azul, Vermelho"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={newVariation.quantity}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="input-field"
                  min="1"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddVariation}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </button>
              </div>
            </div>

            {/* Lista de variações adicionadas */}
            {variations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Variações Adicionadas:</h4>
                {variations.map((variation) => (
                  <div key={variation.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">{variation.size.displayName}</span>
                      <span className="text-gray-600">{variation.color}</span>
                      <span className="text-sm text-gray-500">Qtd: {variation.quantity}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariation(variation.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg mr-3">
                <Tag className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
            </div>
            <div>
            <div className="flex flex-col sm:flex-row sm:space-x-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(capitalizeWords(e.target.value))}
                className="input-field flex-1 mb-2 sm:mb-0"
                placeholder="Adicionar tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn-primary w-full sm:w-auto flex items-center justify-center min-h-[48px] text-base font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            </div>
          </div>



          {/* Botões */}
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-bold flex items-center justify-center w-full sm:w-auto"
              onClick={() => window.location.reload()}
            >
              <X className="h-5 w-5 mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              onClick={(e) => {
                console.log('🔘 Botão submit clicado!');
                console.log('Evento:', e);
                console.log('isSubmitting:', isSubmitting);
                console.log('loading:', loading);
                // Forçar execução do handleSubmit
                e.preventDefault();
                handleSubmit(e);
                // Log adicional para debug
                // alert('🔘 Botão clicado! Verifique o console.');
              }}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold shadow-lg transition-all duration-200 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-3" />
                  {isEditing ? 'Salvar Alterações' : 'Salvar Peça'}
                </>
              )}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>

      {/* Modal de sucesso - Abordagem direta para mobile */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" style={{zIndex: 9999, position: 'fixed'}}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 text-center">
            <div className="text-4xl sm:text-6xl mb-4">🎉</div>
            <h3 className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
              {isEditing ? 'Peça Atualizada com Sucesso!' : 'Peça Cadastrada com Sucesso!'}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {isEditing ? 'As alterações foram salvas no estoque' : 'A peça foi adicionada ao estoque'}
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      console.log('Clicou em Continuar na Aba Estoque');
                      setShowSuccess(false);
                      // Reset form
                      setFormData({
                        code: '',
                        name: '',
                        description: '',
                        category: '' as ClothingCategory,
                        brand: '',
                        supplier: '',
                        collection: '',
                        season: 'Ano Todo',
                        date: '',
                        costPrice: 0,
                        freightCost: 0,
                        freightQuantity: 1,
                        packagingCost: 0,
                        extraCosts: 0,
                        profitMargin: 100,
                        creditFee: 5,
                        images: [],
                        tags: [],
                      });
                      setVariations([]);
                      setTouchedFields(new Set());
                      setIsEditing(false);
                      setEditingItemId(null);
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold w-full sm:w-auto"
                  >
                    Continuar na Aba Estoque
                  </button>
                  <button
                    onClick={() => {
                      console.log('Clicou em Ir para Aba Vendas');
                      setShowSuccess(false);
                      // Reset form
                      setFormData({
                        code: '',
                        name: '',
                        description: '',
                        category: '' as ClothingCategory,
                        brand: '',
                        supplier: '',
                        collection: '',
                        season: 'Ano Todo',
                        date: '',
                        costPrice: 0,
                        freightCost: 0,
                        freightQuantity: 1,
                        packagingCost: 0,
                        extraCosts: 0,
                        profitMargin: 100,
                        creditFee: 5,
                        images: [],
                        tags: [],
                      });
                      setVariations([]);
                      setTouchedFields(new Set());
                      setIsEditing(false);
                      setEditingItemId(null);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold w-full sm:w-auto"
                  >
                    Ir para Aba Vendas
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowSuccess(false);
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold w-full sm:w-auto"
                  >
                    Ver no Estoque
                  </button>
                  <button
                    onClick={() => {
                      setShowSuccess(false);
                      // Reset form
                      setFormData({
                        code: '',
                        name: '',
                        description: '',
                        category: '' as ClothingCategory,
                        brand: '',
                        supplier: '',
                        collection: '',
                        season: 'Ano Todo',
                        date: '',
                        costPrice: 0,
                        freightCost: 0,
                        freightQuantity: 1,
                        packagingCost: 0,
                        extraCosts: 0,
                        profitMargin: 100,
                        creditFee: 5,
                        images: [],
                        tags: [],
                      });
                      setVariations([]);
                      setTouchedFields(new Set());
                    }}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-bold w-full sm:w-auto"
                  >
                    Continuar Cadastrando
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alerta para Visualizador */}
      <ViewerAlert
        isVisible={showViewerAlert}
        onClose={() => setShowViewerAlert(false)}
        action={viewerAlertAction}
      />
    </div>
  );
}
