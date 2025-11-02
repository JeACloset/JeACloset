import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, User, CreditCard, DollarSign, Save, Clock } from 'lucide-react';
import type { ClothingItem, ClothingVariation, Sale, SaleItem, SaleFormData, PaymentMethod } from '../types';
import { useFirestore } from '../hooks/useFirestore';
import { toTitleCase } from '../utils/calculations';
import { useApp } from '../contexts/AppContext';
import ViewerAlert from './ViewerAlert';

export default function SalesRegister() {
  const { data: clothingItems, update: updateClothingItem, loading: clothingLoading, error: clothingError } = useFirestore<ClothingItem>('clothing');
  const { add: addSale, update: updateSale, loading: salesLoading, error: salesError } = useFirestore<Sale>('sales');
  const { setActiveTab } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<ClothingVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Estados para feedback de sucesso
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  // const totalItemsInCart = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Debug: verificar estados dos hooks
  console.log('SalesRegister: clothingLoading:', clothingLoading, 'clothingError:', clothingError);
  console.log('SalesRegister: salesLoading:', salesLoading, 'salesError:', salesError);
  console.log('SalesRegister: showSuccess:', showSuccess, 'successMessage:', successMessage);
  // const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  
  // Estados para alerta do visualizador
  const [showViewerAlert, setShowViewerAlert] = useState(false);
  const [viewerAlertAction, setViewerAlertAction] = useState('');

  // Função para obter data atual no formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Função para formatar telefone no padrão brasileiro (xx) xxxxx-xxxx
  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica a máscara
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    } else {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7, 11)}`;
    }
  };

  // Função para lidar com mudança no campo de telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, customerPhone: formatted }));
  };

  const [formData, setFormData] = useState<SaleFormData>({
    customerName: '',
    customerPhone: '',
    saleDate: getTodayDate(), // Pré-preenchido com data atual
    discount: 0,
    discountType: 'percentual',
    paymentMethod: 'dinheiro',
    notes: ''
  });

  // useEffect para controlar a mensagem de sucesso - REMOVIDO para evitar conflitos

  // Forçar re-renderização quando desconto mudar
  const [discountKey, setDiscountKey] = useState(0);

  // Função para mostrar alerta do visualizador
  const showViewerAlertForAction = (action: string) => {
    setViewerAlertAction(action);
    setShowViewerAlert(true);
  };

  // Detectar se há uma venda sendo editada
  useEffect(() => {
    // Detectar role do usuário logado
    try {
      const rawUser = localStorage.getItem('JEACLOSET_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        setIsViewer(user?.role === 'viewer');
      } else {
        setIsViewer(false);
      }
    } catch {
      setIsViewer(false);
    }

    const editingSaleData = localStorage.getItem('editingSale');
    if (editingSaleData) {
      try {
        const sale = JSON.parse(editingSaleData);
        setEditingSale(sale);
        setIsEditing(true);
        
        // Carregar dados da venda no formulário
        // Converter data de criação para formato YYYY-MM-DD
        let saleDateStr = getTodayDate();
        if (sale.createdAt) {
          try {
            const saleDate = sale.createdAt instanceof Date ? sale.createdAt : new Date(sale.createdAt);
            if (!isNaN(saleDate.getTime())) {
              const year = saleDate.getFullYear();
              const month = String(saleDate.getMonth() + 1).padStart(2, '0');
              const day = String(saleDate.getDate()).padStart(2, '0');
              saleDateStr = `${year}-${month}-${day}`;
            }
          } catch (e) {
            console.error('Erro ao converter data da venda:', e);
          }
        }
        
        setFormData({
          customerName: sale.customerName || '',
          customerPhone: sale.customerPhone || '',
          saleDate: saleDateStr,
          discount: sale.discount || 0,
          discountType: sale.discountType || 'percentual',
          paymentMethod: sale.paymentMethod || 'dinheiro',
          notes: sale.notes || '',
        });
        
        // Carregar itens no carrinho
        setCart(sale.items || []);
        
        // Limpar o localStorage
        localStorage.removeItem('editingSale');
      } catch (error) {
        console.error('Erro ao carregar venda para edição:', error);
        localStorage.removeItem('editingSale');
      }
    }
  }, []);

  // Filtrar itens disponíveis
  const availableItems = clothingItems.filter(item => 
    item.status === 'available' && 
    item.variations.some(v => {
      // Para dados demo (com soldQuantity), calcular disponível
      if (typeof (v as any).soldQuantity === 'number') {
        return (v.quantity - (v as any).soldQuantity) > 0;
      } else {
        // Para dados reais, usar quantity atual (já descontado das vendas)
        return v.quantity > 0;
      }
    }) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Função para verificar se uma variação já está no carrinho
  const isVariationInCart = (variationId: string) => {
    return cart.some(item => item.variationId === variationId);
  };

  // Calcular totais (sempre derivado de unitPrice * quantity para evitar valores obsoletos)
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  
  // Calcular desconto com validação
  let discountValue = 0;
  if (formData.discount > 0) {
    if (formData.discountType === 'percentual') {
      discountValue = (subtotal * formData.discount) / 100;
      } else {
      discountValue = Math.min(formData.discount, subtotal); // Não pode ser maior que o subtotal
    }
  }
  
  const total = Math.max(0, subtotal - discountValue);

  // Forçar re-renderização quando desconto mudar
  useEffect(() => {
    setDiscountKey(prev => prev + 1);
  }, [formData.discount, formData.discountType, subtotal]);

  // Debug: verificar cálculos de desconto
  console.log('SalesRegister Debug:', {
    subtotal,
    discountType: formData.discountType,
    discount: formData.discount,
    discountValue,
    total,
    cartLength: cart.length,
    formData: formData
  });

  // const toggleItemExpansion = (itemId: string) => {
  //   setExpandedItems(prev => {
  //     const newSet = new Set(prev);
  //     if (newSet.has(itemId)) {
  //       newSet.delete(itemId);
  //     } else {
  //       newSet.add(itemId);
  //     }
  //     return newSet;
  //   });
  // };

  const handleAddToCart = () => {
    if (!selectedItem || !selectedVariation || quantity <= 0) return;

    const existingItem = cart.find(item => 
      item.variationId === selectedVariation.id
    );

    if (existingItem) {
      // Atualizar item existente
      setCart(prev => prev.map(item => 
        item.variationId === selectedVariation.id
          ? { 
              ...item, 
              quantity: item.quantity + quantity,
              totalPrice: (item.quantity + quantity) * item.unitPrice // Recalcular totalPrice
            }
          : item
      ));
    } else {
      // Adicionar novo item
      const newItem: SaleItem = {
        id: Date.now().toString(),
        clothingItemId: selectedItem.id,
        clothingItemCode: selectedItem.code,
        clothingItemName: selectedItem.name,
        variationId: selectedVariation.id,
        size: selectedVariation.size.displayName,
        color: selectedVariation.color,
        quantity,
        unitPrice: selectedItem.sellingPrice,
        totalPrice: selectedItem.sellingPrice * quantity
      };
      setCart(prev => [...prev, newItem]);
    }

    // Reset seleção
    setSelectedItem(null);
    setSelectedVariation(null);
    setQuantity(1);

    // Focar carrinho
    try {
      const el = document.getElementById('sales-cart');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch {}
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };


  // Função para debitar itens do estoque
  const debitFromInventory = async (saleItems: SaleItem[]) => {
    console.log('debitFromInventory chamado com:', saleItems);
    
    // Agrupar itens por clothingItemId para processar cada peça uma única vez
    const itemsByClothingId = saleItems.reduce((acc, saleItem) => {
      if (!acc[saleItem.clothingItemId]) {
        acc[saleItem.clothingItemId] = [];
      }
      acc[saleItem.clothingItemId].push(saleItem);
      return acc;
    }, {} as Record<string, SaleItem[]>);

    console.log('Itens agrupados por peça:', itemsByClothingId);

    // Processar cada peça única
    for (const [clothingItemId, items] of Object.entries(itemsByClothingId)) {
      const clothingItem = clothingItems.find(item => item.id === clothingItemId);
      if (clothingItem) {
        console.log('Atualizando item:', clothingItem.name, 'com', items.length, 'variações');
        
        // Criar um mapa das quantidades a debitar por variationId
        const quantitiesToDebit = items.reduce((acc, item) => {
          acc[item.variationId] = (acc[item.variationId] || 0) + item.quantity;
          return acc;
        }, {} as Record<string, number>);

        console.log('Quantidades a debitar:', quantitiesToDebit);

        // Atualizar todas as variações de uma vez
        const updatedVariations = clothingItem.variations.map(variation => {
          const quantityToDebit = quantitiesToDebit[variation.id] || 0;
          if (quantityToDebit > 0) {
            console.log(`Debitando ${quantityToDebit} da variação ${variation.id} (${variation.size.displayName} - ${variation.color})`);
            return {
              ...variation,
              quantity: Math.max(0, variation.quantity - quantityToDebit)
            };
          }
          return variation;
        });

        // Verificar se ainda há variações disponíveis
        const hasAvailableVariations = updatedVariations.some(v => v.quantity > 0);
        const newStatus = hasAvailableVariations ? 'available' : 'sold';

        console.log('Status final do item:', newStatus, 'Variações disponíveis:', hasAvailableVariations);

        await updateClothingItem(clothingItem.id, {
          variations: updatedVariations,
          status: newStatus
        });
        console.log('Item atualizado com sucesso:', clothingItem.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit chamado');
    console.log('Cart:', cart);
    console.log('FormData:', formData);
    
    if (cart.length === 0) {
      alert('Adicione pelo menos um item ao carrinho');
      return;
    }

    if (!formData.customerName.trim()) {
      alert('Nome do cliente é obrigatório para finalizar a venda');
      return;
    }

    try {
      if (isViewer) {
        showViewerAlertForAction('registrar ou editar vendas');
        return;
      }
      setIsSubmitting(true);

      if (isEditing && editingSale) {
        // Converter data do formulário para Date
        const saleDate = new Date(formData.saleDate);
        // Preservar horário original ou usar horário atual se não houver
        const originalDate = editingSale.createdAt instanceof Date 
          ? editingSale.createdAt 
          : new Date(editingSale.createdAt);
        saleDate.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds());
        
        // Atualizar venda existente - remover campos undefined
        const updatedSale: Partial<Sale> = {
          items: cart,
          subtotal,
          discount: discountValue,
          discountType: formData.discountType,
          total,
          paymentMethod: formData.paymentMethod,
          status: 'pago', // Todas as vendas são consideradas pagas
          createdAt: saleDate, // Usar data selecionada no formulário
          updatedAt: new Date(),
        };
        if (formData.customerName && formData.customerName.trim()) {
          updatedSale.customerName = formData.customerName;
        }
        if (formData.customerPhone && formData.customerPhone.trim()) {
          updatedSale.customerPhone = formData.customerPhone;
        }
        if (formData.notes && formData.notes.trim()) {
          updatedSale.notes = formData.notes;
        }

        const result = await updateSale(editingSale.id, updatedSale);
        
        if (result !== null) {
          setSuccessMessage('✅ VENDA ATUALIZADA COM SUCESSO!');
          
          // Usar setTimeout para garantir que o estado seja atualizado
          setTimeout(() => {
            setShowSuccess(true);
          }, 100);
          
          // Reset form
          setFormData({
            customerName: '',
            customerPhone: '',
            saleDate: getTodayDate(),
            discount: 0,
            discountType: 'percentual',
            paymentMethod: 'dinheiro',
            notes: ''
          });
          setCart([]);
          setEditingSale(null);
          setIsEditing(false);
        } else {
          // Falha na atualização (ex.: modo visualização bloqueia updates)
          alert('Não foi possível atualizar a venda. Verifique sua conexão ou permissões e tente novamente.');
        }
      } else {
        // Criar nova venda
        // Converter data do formulário para Date (usar horário atual)
        const saleDate = new Date(formData.saleDate);
        const now = new Date();
        saleDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        
        // Criar objeto de venda removendo campos undefined
        const saleData: any = {
          customerName: formData.customerName,
          items: cart,
          subtotal,
          discount: discountValue,
          discountType: formData.discountType,
          total,
          paymentMethod: formData.paymentMethod,
          status: 'pago', // Todas as vendas são consideradas pagas
          createdAt: saleDate, // Usar data selecionada no formulário
          updatedAt: new Date(),
          sellerName: 'Vendedor' // TODO: Implementar autenticação
        };

        // Adicionar campos opcionais apenas se tiverem valor
        if (formData.customerPhone && formData.customerPhone.trim()) {
          saleData.customerPhone = formData.customerPhone;
        }
        if (formData.notes && formData.notes.trim()) {
          saleData.notes = formData.notes;
        }

        const sale: Omit<Sale, 'id'> = saleData;

        console.log('Criando nova venda:', sale);
        console.log('Estrutura da venda:', JSON.stringify(sale, null, 2));
        
        // Validar dados antes de enviar
        console.log('Validando dados da venda...');
        try {
          if (!sale.customerName) {
            throw new Error('Nome do cliente é obrigatório');
          }
          if (!sale.items || sale.items.length === 0) {
            throw new Error('Carrinho vazio');
          }
          if (sale.total <= 0) {
            throw new Error('Total inválido');
          }
          
          // Validar cada item do carrinho
          sale.items.forEach((item, index) => {
            if (!item.clothingItemId) {
              throw new Error(`Item ${index + 1}: ID da peça é obrigatório`);
            }
            if (!item.variationId) {
              throw new Error(`Item ${index + 1}: ID da variação é obrigatório`);
            }
            if (!item.size) {
              throw new Error(`Item ${index + 1}: Tamanho é obrigatório`);
            }
            if (!item.color) {
              throw new Error(`Item ${index + 1}: Cor é obrigatória`);
            }
            if (item.quantity <= 0) {
              throw new Error(`Item ${index + 1}: Quantidade deve ser maior que zero`);
            }
            if (item.unitPrice <= 0) {
              throw new Error(`Item ${index + 1}: Preço unitário deve ser maior que zero`);
            }
          });
          
          console.log('Dados validados com sucesso, chamando addSale...');
        } catch (validationError) {
          console.error('Erro de validação:', validationError);
          const errorMessage = validationError instanceof Error ? validationError.message : 'Erro de validação desconhecido';
          alert(`❌ Erro de validação: ${errorMessage}`);
          return;
        }
        
        const result = await addSale(sale);
        console.log('Resultado da criação:', result);
        console.log('Tipo do resultado:', typeof result);
        console.log('Result é truthy?', !!result);
        console.log('Result é string?', typeof result === 'string');
        console.log('Result tem length?', 'N/A');
        
        if (result) {
          console.log('Venda criada com sucesso, debitando estoque...');
          // Debitar itens do estoque
          await debitFromInventory(cart);
          
          console.log('Estoque debitado, mostrando sucesso...');
          
          // Mostrar feedback de sucesso IMEDIATAMENTE
          console.log('Mostrando feedback de sucesso...');
          setSuccessMessage('✅ VENDA FINALIZADA COM SUCESSO!');
          
          // Usar setTimeout para garantir que o estado seja atualizado
          setTimeout(() => {
            setShowSuccess(true);
            console.log('Estado showSuccess definido como true');
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
          
          // Mensagem ficará visível até o usuário clicar em um botão
          
          // Reset form APÓS mostrar sucesso
          setTimeout(() => {
            setFormData({
              customerName: '',
              customerPhone: '',
              saleDate: getTodayDate(),
              discount: 0,
              discountType: 'percentual',
              paymentMethod: 'dinheiro',
              notes: ''
            });
            setCart([]);
            setSelectedItem(null);
            setSelectedVariation(null);
            setQuantity(1);
          }, 1000); // Aguarda 1 segundo antes de limpar o form
          
      } else {
        console.error('Falha ao criar venda - result inválido:', result);
        console.error('Tipo do result:', typeof result);
        console.error('Valor do result:', result);
        alert(`❌ Erro ao registrar venda.\n\nResultado: ${result}\nTipo: ${typeof result}\n\nVerifique a conexão com Firebase e tente novamente.`);
      }
      }
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      console.error('Detalhes do erro:', error);
      alert('Erro ao registrar venda. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
               <div className={`p-2 rounded-lg mr-3 ${isEditing ? 'bg-gradient-to-r from-yellow-500 to-orange-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}>
                 <ShoppingCart className="h-5 w-5 text-white" />
               </div>
               <div>
                 <h2 className="text-lg font-bold text-gray-900">
                   {isEditing ? 'Editar Venda' : 'Registrar Vendas'}
                 </h2>
                 <p className="text-xs text-gray-600">
                   {isEditing ? 'Modifique os dados da venda e salve as alterações' : 'Sistema completo de vendas'}
                 </p>
               </div>
            </div>
            <div className="text-right">
              
            </div>
          </div>
        </div>

        {/* Mensagem de erro */}
        {salesError && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl shadow-xl p-6 text-center">
            <div className="text-4xl mb-2">❌</div>
            <h3 className="text-2xl font-bold">Erro no Sistema de Vendas</h3>
            <p className="text-red-100 mb-4">{salesError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white text-red-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center mx-auto font-bold"
            >
              Recarregar Página
            </button>
          </div>
        )}


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Seleção de Produtos */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg mr-3">
                <Search className="h-5 w-5 text-white" />
              </div>
               <h3 className="text-base font-semibold text-gray-900">Catálogo de Produtos</h3>
            </div>
            
            {/* Busca */}
            <div className="relative mb-6 max-w-full sm:max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="🔍 Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
              />
            </div>

             {/* Lista de Produtos (simplificada, coluna única) */}
             <div className="max-h-96 overflow-y-auto overflow-x-hidden">
               <div className="space-y-3">
               {availableItems.map(item => {
                   const totalAvailable = item.variations.reduce((sum, v) => {
                     // Para dados demo (com soldQuantity), calcular disponível
                     if (typeof (v as any).soldQuantity === 'number') {
                       return sum + (v.quantity - (v as any).soldQuantity);
                     } else {
                       // Para dados reais, usar quantity atual (já descontado das vendas)
                       return sum + v.quantity;
                     }
                   }, 0);
                 return (
                  <div key={item.id} className={`p-3 sm:p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-lg break-words ${selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                       <button
                         type="button"
                        className="w-full text-left"
                       onClick={() => {
                         setSelectedItem(item);
                           setSelectedVariation(null);
                       }}
                     >
                      <div className="flex justify-between items-start">
                          <div className="flex-1 pr-3 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1 truncate">{item.name}</h4>
                            <p className="text-xs text-gray-500 mb-1 break-all">Código: {item.code}</p>
                            <div className="text-xs sm:text-sm text-gray-600">
                               <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                 {totalAvailable} disponíveis
                             </span>
                           </div>
                             </div>
                           <div className="text-right">
                            <div className="text-base sm:text-lg font-bold text-green-600">R$ {item.sellingPrice.toFixed(2)}</div>
                           </div>
                         </div>
                       </button>
                           </div>
                   );
                 })}
                           </div>
                         </div>

                     </div>

          {/* Painel de Variações (lateral) */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 flex flex-col space-y-4">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-2 rounded-lg mr-3">
                <Search className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Variações</h3>
            </div>
            {!selectedItem ? (
              <div className="text-sm text-gray-500">Selecione um produto no catálogo para ver as variações.</div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-700 font-semibold">{selectedItem.name}</div>
                <div className="space-y-2">
                           {selectedItem.variations
                             .filter(v => {
                               // Para dados demo (com soldQuantity), calcular disponível
                               if (typeof (v as any).soldQuantity === 'number') {
                                 return (v.quantity - (v as any).soldQuantity) > 0 && !isVariationInCart(v.id);
                               } else {
                                 // Para dados reais, usar quantity atual (já descontado das vendas)
                                 return v.quantity > 0 && !isVariationInCart(v.id);
                               }
                             })
                             .map(variation => (
                      <button
                               key={variation.id}
                        type="button"
                               onClick={() => setSelectedVariation(variation)}
                        className={`w-full text-left p-2 border-2 rounded-md transition-all ${selectedVariation?.id === variation.id ? 'border-blue-500 bg-blue-100' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 text-sm">{variation.size.displayName} - {variation.color}</span>
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                            {typeof (variation as any).soldQuantity === 'number' 
                              ? variation.quantity - (variation as any).soldQuantity 
                              : variation.quantity} disp.
                                   </span>
                                 </div>
                      </button>
                           ))}
                           {selectedItem.variations.filter(v => {
                             // Para dados demo (com soldQuantity), calcular disponível
                             if (typeof (v as any).soldQuantity === 'number') {
                               return (v.quantity - (v as any).soldQuantity) > 0 && !isVariationInCart(v.id);
                             } else {
                               // Para dados reais, usar quantity atual (já descontado das vendas)
                               return v.quantity > 0 && !isVariationInCart(v.id);
                             }
                           }).length === 0 && (
                    <div className="p-3 text-center text-gray-500 bg-gray-100 rounded-lg text-sm">Todas as variações disponíveis já estão no carrinho</div>
                           )}
                         </div>
                         {selectedVariation && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                             <div className="flex items-center justify-between mb-2">
                               <label className="font-medium text-gray-700 text-sm">Quantidade:</label>
                               <div className="flex items-center space-x-2">
                        <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"><Minus className="h-3 w-3" /></button>
                        <input type="number" min="1" max={selectedVariation.quantity} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(selectedVariation.quantity, parseInt(e.target.value) || 1)))} className="w-12 text-center border-2 border-gray-200 rounded-md px-1 py-1 font-bold text-sm" />
                        <button type="button" onClick={() => setQuantity(Math.min(selectedVariation.quantity, quantity + 1))} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"><Plus className="h-3 w-3" /></button>
                               </div>
                             </div>
                    <button type="button" onClick={handleAddToCart} className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center font-semibold text-sm shadow-md">
                               <Plus className="h-4 w-4 mr-1" />
                               Adicionar ao Carrinho
                             </button>
                           </div>
                         )}
                       </div>
                     )}

            
                   </div>
             </div>

        {/* Formulário de Finalização */}
        {cart.length > 0 && (
          <div id="sales-cart" className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 mt-6">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg mr-3">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
               <h3 className="text-base font-semibold text-gray-900">Carrinho de Vendas</h3>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 flex-wrap gap-2">
                  <div className="flex-1 pr-4 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.clothingItemName}</p>
                    <p className="text-xs text-gray-600 break-words">{item.size} - {item.color}</p>
                </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 text-sm sm:text-base">R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                    <button type="button" onClick={() => handleRemoveFromCart(item.id)} className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
              ))}
                  </div>
            <div className="mt-4 text-right text-base sm:text-lg font-bold text-green-600">
              Subtotal: R$ {subtotal.toFixed(2)}
                 </div>
               </div>
             )}

        {/* Formulário de Finalização */}
        {cart.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-8">
            <div className="flex items-center mb-6 sm:mb-8">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 sm:p-3 rounded-xl mr-3 sm:mr-4">
                <Save className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Finalizar Venda</h3>
                <p className="text-xs sm:text-sm text-gray-600">Complete os dados para processar a venda</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8" noValidate>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                {/* Dados do Cliente */}
                <div className="space-y-6">
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 sm:mr-3"></div>
                    Dados do Cliente
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Nome do cliente *"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: toTitleCase(e.target.value) }))}
                        className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base sm:text-lg"
                        required
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="Telefone (opcional) - (xx) xxxxx-xxxx"
                        value={formData.customerPhone || ''}
                        onChange={handlePhoneChange}
                        maxLength={15}
                        className="w-full pl-4 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base sm:text-lg"
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="date"
                        value={formData.saleDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base sm:text-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-6">
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 sm:mr-3"></div>
                    Forma de Pagamento
                  </h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'dinheiro', label: 'Dinheiro/PIX', icon: DollarSign, color: 'from-green-500 to-emerald-600' },
                      { value: 'cartao_debito', label: 'Débito', icon: CreditCard, color: 'from-purple-500 to-indigo-600' },
                      { value: 'cartao_credito', label: 'Crédito', icon: CreditCard, color: 'from-orange-500 to-red-600' }
                    ].map(payment => {
                      const Icon = payment.icon;
                      return (
                        <button
                          key={payment.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: payment.value as PaymentMethod }))}
                          className={`p-3 sm:p-4 border-2 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 hover:shadow-lg ${
                            formData.paymentMethod === payment.value
                              ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${payment.color}`}>
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                          <span className="font-medium text-sm sm:text-base">{payment.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                </div>
              </div>

              {/* Resumo da Venda (compacto, abaixo do carrinho, alinhado à direita) */}
              <div className="flex justify-end">
                <div key={discountKey} className="mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 w-full max-w-full sm:max-w-sm">
                  <h4 className="font-bold text-gray-900 mb-3 text-sm">Resumo da Venda</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as 'percentual' | 'valor_fixo' }))}
                        className="text-xs border-2 border-gray-200 rounded-lg px-2 py-1 focus:border-blue-500"
                      >
                        <option value="percentual">%</option>
                        <option value="valor_fixo">R$</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={formData.discount}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        className="flex-1 text-xs border-2 border-gray-200 rounded-lg px-2 py-1 focus:border-blue-500"
                        placeholder="Desconto"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Desconto</span>
                      <span className="font-medium text-red-600">-R$ {discountValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-2">
                      <span>Total</span>
                      <span className="text-green-600">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-8 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setFormData({
                      customerName: '',
                      customerPhone: '',
                      saleDate: getTodayDate(),
                      discount: 0,
                      discountType: 'percentual',
                      paymentMethod: 'dinheiro',
                      notes: ''
                    });
                  }}
                  className="px-4 py-3 sm:px-8 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-bold text-base sm:text-lg"
                >
                  Limpar Tudo
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (editingSale) {
                        try {
                          setIsSubmitting(true);
                          const updatedSale: Sale = {
                            ...editingSale,
                            status: 'pendente',
                            updatedAt: new Date(),
                          };
                          await updateSale(editingSale.id, updatedSale);
                          setShowSuccess(true);
                          setSuccessMessage('✅ VENDA MARCADA COMO PENDENTE!');
                          setFormData({
                            customerName: '',
                            customerPhone: '',
                            saleDate: getTodayDate(),
                            discount: 0,
                            discountType: 'percentual',
                            paymentMethod: 'dinheiro',
                            notes: ''
                          });
                          setCart([]);
                          setEditingSale(null);
                          setIsEditing(false);
                        } catch (error) {
                          console.error('Erro ao marcar venda como pendente:', error);
                          alert('Erro ao marcar venda como pendente. Tente novamente.');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }
                    }}
                    disabled={isSubmitting}
                    className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:from-yellow-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-bold text-base sm:text-lg shadow-xl transition-all duration-200"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3 inline-block"></span>
                        Marcando...
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5 mr-3" />
                        Marcar como Pendente
                      </>
                    )}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || salesLoading || (isViewer && isEditing)}
                  className="px-4 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-bold text-base sm:text-lg shadow-xl transition-all duration-200"
                >
                  {isSubmitting || salesLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3 inline-block"></span>
                      {isEditing ? 'Atualizando...' : 'Finalizando...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-3" />
                      {isEditing ? (isViewer ? 'Somente Visualização' : 'Atualizar Venda') : 'Finalizar Venda'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal de sucesso simples */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">Venda Registrada com Sucesso!</h3>
            <p className="text-gray-600 mb-6">A venda foi processada com sucesso!</p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => {
                  console.log('SalesRegister: Clicou em Ver Histórico de Vendas');
                  setShowSuccess(false);
                  setActiveTab('history');
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
              >
                Ver Histórico
              </button>
              <button
                onClick={() => {
                  console.log('SalesRegister: Clicou em Continuar Vendendo');
                  setShowSuccess(false);
                }}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-bold"
              >
                Continuar Vendendo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal global removido para evitar feedback duplicado */}
      
      {/* Alerta para Visualizador */}
      <ViewerAlert
        isVisible={showViewerAlert}
        onClose={() => setShowViewerAlert(false)}
        action={viewerAlertAction}
      />
    </div>
  );
}
