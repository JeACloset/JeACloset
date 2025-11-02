import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Package, TrendingUp, DollarSign, X, Calendar, Tag, ShoppingBag, List, Plus, CheckCircle, AlertTriangle, CheckCircle2, ShoppingCart } from 'lucide-react';
import type { ClothingItem, ClothingCategory, Sale } from '../types';
import { useFirestore } from '../hooks/useFirestore';
import { useApp } from '../contexts/AppContext';
import ViewerAlert from './ViewerAlert';

export default function InventoryManager() {
  const { data: clothingItems, loading, error, remove, update } = useFirestore<ClothingItem>('clothing');
  const { data: sales } = useFirestore<Sale>('sales');
  const { setActiveTab } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'sold'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'createdAt' | 'sellingPrice'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Estados para modais
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Estados para feedback de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Estados para alerta do visualizador
  const [showViewerAlert, setShowViewerAlert] = useState(false);
  const [viewerAlertAction, setViewerAlertAction] = useState('');

  const categories: ClothingCategory[] = [
    'Blusas', 'Camisetas', 'Vestidos', 'Calças', 'Shorts', 'Saias',
    'Jaquetas', 'Blazers', 'Casacos', 'Outros'
  ];

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

  // Bloquear apenas rolagem horizontal em mobile
  useEffect(() => {
    const originalOverflowX = document.body.style.overflowX;
    const originalTouchAction = document.body.style.touchAction;
    
    document.body.style.overflowX = 'hidden';
    document.body.style.touchAction = 'pan-y';
    
    // Adicionar meta tag para controlar zoom
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    return () => {
      document.body.style.overflowX = originalOverflowX;
      document.body.style.touchAction = originalTouchAction;
      
      // Restaurar viewport original
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  // Função para mostrar alerta do visualizador
  const showViewerAlertForAction = (action: string) => {
    setViewerAlertAction(action);
    setShowViewerAlert(true);
  };

  // Função para calcular vendas por item de roupa baseado em dados reais
  // Conta TODAS as vendas (pago + pendente) para estoque/relatórios/investimentos
  const getSoldQuantityForItem = (clothingItemId: string) => {
    if (!sales) return 0;
    
    return sales.reduce((total, sale) => {
      // Contar todas as vendas independente do status (pago + pendente)
      return total + sale.items.reduce((saleTotal, item) => {
        return saleTotal + (item.clothingItemId === clothingItemId ? item.quantity : 0);
      }, 0);
    }, 0);
  };

  // Filtrar e ordenar itens
  const filteredItems = clothingItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      // Primeiro ordenar por status: 'available' antes de 'sold'
      if (a.status !== b.status) {
        if (a.status === 'available') return -1;
        if (b.status === 'available') return 1;
      }
      
      // Depois ordenar pelo critério selecionado
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'sellingPrice':
          aValue = a.sellingPrice;
          bValue = b.sellingPrice;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Calcular estatísticas com 4 informações: disponíveis, vendidas, variações e total de peças
  const stats = {
    // Total de peças (disponíveis + vendidas)
    totalItems: clothingItems.reduce((sum, item) => {
      // Calcular disponíveis (quantidade atual das variações)
      const available = item.variations.reduce((itemSum, variation) => {
        return itemSum + variation.quantity;
      }, 0);
      
      // Calcular vendidas
      const sold = (() => {
        // Para visualizador (dados demo), usar soldQuantity das variações
        if (isViewer()) {
          return item.variations.reduce((itemSum, variation) => {
            return itemSum + ((variation as any).soldQuantity || 0);
          }, 0);
        } else {
          // Para admin/usuário (dados reais), calcular vendas baseado na coleção sales
          return getSoldQuantityForItem(item.id);
        }
      })();
      
      return sum + available + sold;
    }, 0),
    // Peças disponíveis (quantidade atual das variações - já descontadas as vendas)
    availableItems: clothingItems.reduce((sum, item) => {
      // Usar sempre a quantidade atual das variações (já descontadas as vendas)
      return sum + item.variations.reduce((itemSum, variation) => {
        return itemSum + variation.quantity;
      }, 0);
    }, 0),
    // Peças vendidas
    soldItems: clothingItems.reduce((sum, item) => {
      // Para visualizador (dados demo), usar soldQuantity das variações
      if (isViewer()) {
        return sum + item.variations.reduce((itemSum, variation) => {
          return itemSum + ((variation as any).soldQuantity || 0);
        }, 0);
      } else {
        // Para admin/usuário (dados reais), calcular vendas baseado na coleção sales
        return sum + getSoldQuantityForItem(item.id);
      }
    }, 0),
    // Total de variações (cores/tamanhos diferentes)
    totalVariations: clothingItems.reduce((sum, item) => {
      return sum + item.variations.length;
    }, 0),
    totalValue: clothingItems.reduce((sum, item) => {
      // Calcular quantidade total de peças (disponíveis + vendidas)
      const available = item.variations.reduce((itemSum, variation) => {
        return itemSum + variation.quantity;
      }, 0);
      
      const sold = (() => {
        if (isViewer()) {
          return item.variations.reduce((itemSum, variation) => {
            return itemSum + ((variation as any).soldQuantity || 0);
          }, 0);
        } else {
          return getSoldQuantityForItem(item.id);
        }
      })();
      
      const totalPieces = available + sold;
      return sum + (item.sellingPrice * totalPieces);
    }, 0),
    expectedProfit: clothingItems.reduce((sum, item) => {
      // Calcular quantidade total de peças (disponíveis + vendidas)
      const available = item.variations.reduce((itemSum, variation) => {
        return itemSum + variation.quantity;
      }, 0);
      
      const sold = (() => {
        if (isViewer()) {
          return item.variations.reduce((itemSum, variation) => {
            return itemSum + ((variation as any).soldQuantity || 0);
          }, 0);
        } else {
          return getSoldQuantityForItem(item.id);
        }
      })();
      
      const totalPieces = available + sold;
      
      // Calcular frete unitário (frete total dividido pela quantidade total de peças)
      const freightPerUnit = totalPieces > 0 ? (item.freightCost || 0) / totalPieces : 0;
      
      // Calcular custo total por peça
      const totalCost = item.costPrice + freightPerUnit + (item.extraCosts || 0) + (item.packagingCost || 0) + (item.creditFee || 0);
      const profitPerPiece = item.sellingPrice - totalCost;
      
      return sum + (profitPerPiece * totalPieces);
    }, 0),
  };

  const handleDeleteClick = (item: ClothingItem) => {
    if (isViewer()) {
      showViewerAlertForAction('excluir peças do estoque');
      return;
    }
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        await remove(itemToDelete.id);
        setShowDeleteModal(false);
        setItemToDelete(null);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (error) {
        console.error('Erro ao excluir peça:', error);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleViewItem = (item: ClothingItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEditItem = (item: ClothingItem) => {
    if (isViewer()) {
      showViewerAlertForAction('editar peças do estoque');
      return;
    }
    console.log('handleEditItem chamado para item:', item.name);
    // Salvar item no localStorage para edição
    localStorage.setItem('editingClothingItem', JSON.stringify(item));
    // Redirecionar para aba cadastro
    setActiveTab('clothing');
  };

  const handleStatusChange = async (id: string, newStatus: 'available' | 'sold') => {
    if (isViewer()) {
      showViewerAlertForAction('alterar status das peças');
      return;
    }
    await update(id, { status: newStatus });
  };

  const closeModals = () => {
    setShowViewModal(false);
    setShowDeleteModal(false);
    setSelectedItem(null);
    setItemToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Carregando estoque...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-600 text-center">
          <h3 className="text-lg font-medium mb-2">Erro ao carregar estoque</h3>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 btn-primary"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-[45%] -ml-4 sm:w-full sm:ml-0 sm:p-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 rounded-xl mr-4">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Gerenciar Estoque</h2>
                <p className="text-sm text-gray-600">Controle completo do seu inventário</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalItems}
              </div>
              <div className="text-sm text-gray-600">peças cadastradas</div>
            </div>
          </div>
        </div>

        {/* Estatísticas Mobile */}
        <div className="block sm:hidden">
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl shadow-xl p-6 w-[45%] -ml-4 min-h-[60px] text-white">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <ShoppingBag className="h-4 w-4 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-blue-100">Total de Peças</p>
                  <p className="text-base font-bold text-white">{stats.totalItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 w-[45%] -ml-4 min-h-[60px] text-white">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-green-100">Disponíveis</p>
                  <p className="text-base font-bold text-white">{stats.availableItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl shadow-xl p-6 w-[45%] -ml-4 min-h-[60px] text-white">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-red-100">Vendidas</p>
                  <p className="text-base font-bold text-white">{stats.soldItems}</p>
                </div>
              </div>
            </div>


            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl shadow-xl p-6 w-[45%] -ml-4 min-h-[60px] text-white">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-yellow-100">Valor Total</p>
                  <p className="text-sm font-bold text-white leading-tight">
                    R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 w-[45%] -ml-4 min-h-[60px] text-white">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-purple-100">Lucro Esperado</p>
                  <p className="text-sm font-bold text-white leading-tight">
                    R$ {stats.expectedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
        </div>
        </div>
        
        {/* Estatísticas Desktop */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg text-white min-h-[60px] w-full">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-blue-100">Total de Peças</p>
                  <p className="text-xl font-bold text-white">{stats.totalItems}</p>
                </div>
              </div>
            </div>

             <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg text-white min-h-[60px] w-full">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-green-100">Disponíveis</p>
                  <p className="text-xl font-bold text-white">{stats.availableItems}</p>
                </div>
              </div>
            </div>

             <div className="bg-gradient-to-r from-red-500 to-pink-600 p-3 rounded-xl shadow-lg text-white min-h-[60px] w-full">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-red-100">Vendidas</p>
                  <p className="text-xl font-bold text-white">{stats.soldItems}</p>
                </div>
              </div>
            </div>


             <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-3 rounded-xl shadow-lg text-white min-h-[60px] w-full">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-yellow-100">Valor Total</p>
                  <p className="text-sm font-bold text-white leading-tight">
                    R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

             <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg text-white min-h-[60px] w-full">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-purple-100">Lucro Esperado</p>
                  <p className="text-sm font-bold text-white leading-tight">
                    R$ {stats.expectedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-[45%] -ml-4 sm:w-full sm:ml-0 sm:p-4">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg mr-3">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Filtros e Busca</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
                placeholder="Código, nome, marca ou fornecedor..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ClothingCategory | '')}
              className="input-field"
            >
              <option value="">Todas as categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'available' | 'sold')}
              className="input-field"
            >
              <option value="all">Todos</option>
              <option value="available">Disponível</option>
              <option value="sold">Vendido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input-field flex-1"
              >
                <option value="createdAt">Data de Cadastro</option>
                <option value="name">Nome</option>
                <option value="category">Categoria</option>
                <option value="sellingPrice">Preço</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="btn-secondary px-3"
                title={`Ordenar ${sortOrder === 'asc' ? 'decrescente' : 'crescente'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Lista de Itens */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-x-auto w-[45%] -ml-4 sm:w-full sm:ml-0">
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-2 rounded-lg mr-3">
                  <List className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Peças ({filteredItems.length})
                </h3>
              </div>
              <div className="text-sm text-gray-600">
                {filteredItems.length} de {stats.totalItems} peças
              </div>
            </div>
          </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-800">Erro: {error}</p>
          </div>
        )}

          {filteredItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma peça encontrada</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCategory || selectedStatus !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece cadastrando sua primeira peça.'}
              </p>
              {!searchTerm && !selectedCategory && selectedStatus === 'all' && (
                <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-bold flex items-center mx-auto">
                  <Plus className="h-5 w-5 mr-2" />
                  Cadastrar Primeira Peça
                </button>
              )}
            </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm sm:table-auto table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 sm:w-auto">
                    Peça
                  </th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 sm:w-auto">
                    Categoria
                  </th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 sm:w-auto">
                    Disponíveis / Vendidas
                  </th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12 sm:w-auto">
                    Preço
                  </th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12 sm:w-auto">
                    Status
                  </th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 sm:w-auto">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 sm:px-6 sm:py-4 w-1/4 sm:w-auto">
                      <div className="min-w-0 sm:min-w-0 truncate sm:truncate">
                        <div className="text-sm font-medium text-gray-900 truncate sm:truncate" title={item.name}>{item.name}</div>
                        <div className="text-sm text-gray-500 truncate sm:truncate">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{item.code}</span>
                        </div>
                        <div className="text-sm text-gray-500 truncate sm:truncate" title={`${item.brand && `${item.brand} • `}${item.supplier}`}>
                          {item.brand && `${item.brand} • `}
                          {item.supplier}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 w-1/6 sm:w-auto">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 truncate sm:truncate">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 w-1/4 sm:w-auto text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="text-xs text-green-600 font-medium truncate sm:truncate">
                          <span className="sm:hidden">Disp: </span>
                          <span className="hidden sm:inline">Disponíveis: </span>
                          {item.variations.reduce((sum, v) => sum + v.quantity, 0)}
                        </div>
                        <div className="text-xs text-red-600 font-medium truncate sm:truncate">
                          <span className="sm:hidden">Vend: </span>
                          <span className="hidden sm:inline">Vendidas: </span>
                          {(() => {
                            // Para visualizador (dados demo), usar soldQuantity das variações
                            if (isViewer()) {
                              return item.variations.reduce((sum, v) => {
                                return sum + ((v as any).soldQuantity || 0);
                              }, 0);
                            } else {
                              // Para admin/usuário (dados reais), calcular vendas baseado na coleção sales
                              return getSoldQuantityForItem(item.id);
                            }
                          })()}
                        </div>
                        <div className="text-xs text-indigo-600 font-medium truncate sm:truncate">
                          <span className="sm:hidden">Var: </span>
                          <span className="hidden sm:inline">Variações: </span>
                          {item.variations.length}
                        </div>
                        <div className="text-xs text-gray-400 truncate sm:truncate">
                          Total: {(() => {
                            // Calcular disponíveis (quantidade atual das variações)
                            const available = item.variations.reduce((sum, v) => sum + v.quantity, 0);
                            
                            // Calcular vendidas
                            const sold = (() => {
                              // Para visualizador (dados demo), usar soldQuantity das variações
                              if (isViewer()) {
                                return item.variations.reduce((sum, v) => {
                                  return sum + ((v as any).soldQuantity || 0);
                                }, 0);
                              } else {
                                // Para admin/usuário (dados reais), calcular vendas baseado na coleção sales
                                return getSoldQuantityForItem(item.id);
                              }
                            })();
                            
                            return available + sold;
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 w-1/12 sm:w-auto text-sm font-medium text-gray-900 truncate sm:truncate">
                      R$ {item.sellingPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 w-1/12 sm:w-auto">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'available' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <span className="sm:hidden">{item.status === 'available' ? 'Disp' : 'Vend'}</span>
                        <span className="hidden sm:inline">{item.status === 'available' ? 'Disponível' : 'Vendido'}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 w-1/6 sm:w-auto text-sm font-medium">
                      <div className="flex space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleViewItem(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(item.id, item.status === 'available' ? 'sold' : 'available')}
                          className={`${item.status === 'available' ? 'text-green-600 hover:text-green-900' : 'text-yellow-600 hover:text-yellow-900'}`}
                          title={item.status === 'available' ? 'Marcar como vendido' : 'Marcar como disponível'}
                        >
                          {item.status === 'available' ? '✓' : '↻'}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Visualização */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Detalhes da Peça</h3>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Informações Básicas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nome:</span>
                      <span className="font-medium">{selectedItem.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Código:</span>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedItem.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categoria:</span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                        {selectedItem.category}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Marca:</span>
                      <span className="font-medium">{selectedItem.brand || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fornecedor:</span>
                      <span className="font-medium">{selectedItem.supplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coleção:</span>
                      <span className="font-medium">{selectedItem.collection || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temporada:</span>
                      <span className="font-medium">{selectedItem.season}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Preços e Custos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preço de Custo:</span>
                      <span className="font-medium">R$ {selectedItem.costPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preço de Venda:</span>
                      <span className="font-bold text-lg text-green-600">R$ {selectedItem.sellingPrice.toFixed(2)}</span>
                    </div>
                    {/* Lucro por peça e total do estoque disponível */}
                    {(() => {
                      // Usar a mesma fórmula do ClothingForm para consistência
                      // Frete unitário = frete do lote / quantidade de peças no lote (não total de variações)
                      const freightPerUnit = (selectedItem.freightCost || 0) && (selectedItem.freightQuantity || 1) 
                        ? (selectedItem.freightCost || 0) / (selectedItem.freightQuantity || 1) 
                        : 0;
                      
                      // Cálculo idêntico ao ClothingForm
                      const baseCost = (selectedItem.costPrice || 0) + freightPerUnit + (selectedItem.extraCosts || 0);
                      const creditFeeAmount = baseCost * ((selectedItem.creditFee || 0) / 100);
                      
                      // Lucro = preço de venda - (custo base + taxa crédito + embalagem)
                      const unitProfit = (selectedItem.sellingPrice || 0) - (baseCost + creditFeeAmount + (selectedItem.packagingCost || 0));
                      
                      const available = selectedItem.variations.reduce((sum, v) => sum + (v.quantity || 0), 0);
                      const totalProfit = unitProfit * available;
                      return (
                        <div className="mt-2 p-2 rounded-lg bg-green-50 border border-green-200">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lucro (por peça):</span>
                            <span className="font-semibold text-green-700">R$ {Number.isFinite(unitProfit) ? unitProfit.toFixed(2) : '0,00'}</span>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-gray-600">Lucro total (estoque disponível):</span>
                            <span className="font-medium text-green-700">R$ {Number.isFinite(totalProfit) ? totalProfit.toFixed(2) : '0,00'}</span>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frete por Lote:</span>
                      <span className="font-medium">R$ {selectedItem.freightCost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Qtd. peças Lote:</span>
                      <span className="font-medium">{selectedItem.freightQuantity || 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Embalagem:</span>
                      <span className="font-medium">R$ {selectedItem.packagingCost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Custos Extras:</span>
                      <span className="font-medium">R$ {selectedItem.extraCosts?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Margem de Lucro:</span>
                      <span className="font-medium">{selectedItem.profitMargin}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa de Crédito:</span>
                      <span className="font-medium">{selectedItem.creditFee || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variações */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Variações</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedItem.variations.map((variation, index) => {
                    // Calcular vendas para esta variação específica
                    const soldQuantity = (() => {
                      // Para visualizador (dados demo), usar soldQuantity das variações
                      if (isViewer()) {
                        const sold = (variation as any).soldQuantity || 0;
                        console.log(`=== MODAL DEBUG ${variation.color} (VIEWER) ===`);
                        console.log(`Item ID: ${selectedItem.id}`);
                        console.log(`Variação ID: ${variation.id}`);
                        console.log(`Variação size: ${variation.size.displayName}`);
                        console.log(`Variação color: ${variation.color}`);
                        console.log(`Quantidade atual: ${variation.quantity}`);
                        console.log(`Vendidas (soldQuantity): ${sold}`);
                        console.log(`Quantidade original: ${variation.quantity + sold}`);
                        console.log(`Disponíveis: ${variation.quantity}`);
                        return sold;
                      } else {
                        // Para admin/usuário (dados reais), usar vendas da coleção sales
                        if (sales && sales.length > 0) {
                          const sold = sales.reduce((total, sale) => {
                            return total + sale.items.reduce((saleTotal, item) => {
                              return saleTotal + (item.clothingItemId === selectedItem.id && item.variationId === variation.id ? item.quantity : 0);
                            }, 0);
                          }, 0);
                          console.log(`=== MODAL DEBUG ${variation.color} (REAL) ===`);
                          console.log(`Item ID: ${selectedItem.id}`);
                          console.log(`Variação ID: ${variation.id}`);
                          console.log(`Variação size: ${variation.size.displayName}`);
                          console.log(`Variação color: ${variation.color}`);
                          console.log(`Quantidade atual: ${variation.quantity}`);
                          console.log(`Vendidas calculadas: ${sold}`);
                          console.log(`Quantidade original: ${variation.quantity + sold}`);
                          console.log(`Disponíveis: ${variation.quantity}`);
                          return sold;
                        } else {
                          return 0;
                        }
                      }
                    })();
                    
                    // Quantidade original = quantidade atual + vendidas
                    const originalQuantity = variation.quantity + soldQuantity;
                    
                    // Disponíveis = quantidade atual (já descontadas as vendas)
                    const availableQuantity = variation.quantity;
                    
                    return (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{variation.size.displayName}</span>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Qtd Cadastrada: {originalQuantity}</div>
                            {soldQuantity > 0 && (
                              <div className="text-xs text-red-600">Vendidas: {soldQuantity}</div>
                            )}
                            <div className="text-xs text-green-600 font-medium">Disponíveis: {availableQuantity}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Cor: {variation.color}
                        </div>
                        {variation.sku && (
                          <div className="text-xs text-gray-500 mt-1">
                            SKU: {variation.sku}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status e Datas */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedItem.status === 'available' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedItem.status === 'available' ? 'Disponível' : 'Vendido'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Cadastrado em {(() => {
                    try {
                      let date = selectedItem.createdAt;
                      
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
        </div>


      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-200">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-3 rounded-xl mr-4">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Confirmar Exclusão</h3>
                  <p className="text-sm text-gray-600">Esta ação não pode ser desfeita</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Tem certeza que deseja excluir a peça:
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-semibold text-gray-900">{itemToDelete.name}</div>
                  <div className="text-sm text-gray-600">Código: {itemToDelete.code}</div>
                  <div className="text-sm text-gray-600">Categoria: {itemToDelete.category}</div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl hover:from-red-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de Sucesso */}
      {showSuccessMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-bold">Peça excluída com sucesso!</div>
              <div className="text-sm text-green-100">A peça foi removida do estoque</div>
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
