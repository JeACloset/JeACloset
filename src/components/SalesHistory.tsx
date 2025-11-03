import { useState } from 'react';
import { Search, Filter, Calendar, DollarSign, CreditCard, Eye, Edit, Trash2, CheckCircle, Clock, XCircle, ShoppingCart, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Sale, ClothingItem } from '../types';
import { useFirestore } from '../hooks/useFirestore';
import { toTitleCase } from '../utils/calculations';
import { useApp } from '../contexts/AppContext';
import ViewerAlert from './ViewerAlert';

export default function SalesHistory() {
  const { data: sales, loading, error, update, remove: deleteSale } = useFirestore<Sale>('sales');
  const { data: clothingItems, update: updateClothingItem } = useFirestore<ClothingItem>('clothing');
  const { setActiveTab } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estados para feedback de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para alerta do visualizador
  const [showViewerAlert, setShowViewerAlert] = useState(false);
  const [viewerAlertAction, setViewerAlertAction] = useState('');

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

  // Filtrar vendas
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    
    const matchesDate = (() => {
      if (dateFilter === 'all') return true;
      
      const saleDate = new Date(sale.createdAt);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return saleDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return saleDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return saleDate >= monthAgo;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Helper: valor líquido de uma venda (desconta taxa se for cartão crédito)
  const getSaleNet = (sale: Sale) => {
    if (sale.paymentMethod !== 'cartao_credito' && sale.paymentMethod !== 'cartao_debito') return sale.total;
    return sale.items.reduce((acc, item) => {
      const ci = clothingItems.find(c => c.id === item.clothingItemId);
      const percent = Number(ci?.creditFee) || 0;
      const fee = item.totalPrice * (percent / 100);
      return acc + (item.totalPrice - fee);
    }, 0);
  };

  // Calcular estatísticas (usando valores líquidos)
  const totalSales = filteredSales.length;
  const paidSales = filteredSales.filter(sale => sale.status === 'pago');
  const pendingSales = filteredSales.filter(sale => sale.status === 'pendente');
  
  const totalRevenue = paidSales.reduce((sum, sale) => sum + getSaleNet(sale), 0);
  // Vendas pendentes também devem usar valor líquido (após descontar taxas de cartão)
  const pendingRevenue = pendingSales.reduce((sum, sale) => sum + getSaleNet(sale), 0);
  
  // Calcular lucro total (vendas pagas - custos)
  const totalProfit = paidSales.reduce((sum, sale) => {
    const totalCost = sale.items.reduce((itemSum, item) => {
      // Assumindo que temos acesso aos custos através do clothingItemId
      // Por enquanto, vamos usar uma estimativa baseada no preço de venda
      const estimatedCost = item.unitPrice * 0.6; // Estimativa de 60% do preço como custo
      return itemSum + (estimatedCost * item.quantity);
    }, 0);
    return sum + (sale.total - totalCost);
  }, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelado':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  // Formatar apenas data (sem horário)
  const formatDateOnly = (date: Date | any) => {
    try {
      // Se for um timestamp do Firebase, converter para Date
      if (date && typeof date === 'object' && date.toDate) {
        date = date.toDate();
      }
      
      // Se for uma string, tentar converter para Date
      if (typeof date === 'string') {
        date = new Date(date);
      }
      
      // Se não for um objeto Date válido, criar um novo Date
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('Data inválida recebida:', date);
        return 'Data inválida';
      }
      
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Erro ao formatar data:', error, 'Data recebida:', date);
      return 'Data inválida';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPaymentIcon = (method: Sale['paymentMethod']) => {
    if (method === 'dinheiro' || method === 'pix') {
      return <DollarSign className="h-4 w-4 text-green-600" />;
    }
    if (method === 'cartao_debito') {
      return <CreditCard className="h-4 w-4 text-purple-600" />;
    }
    if (method === 'cartao_credito') {
      return <CreditCard className="h-4 w-4 text-orange-500" />;
    }
    return null;
  };

  // Calcular taxa de cartão e total líquido para a venda selecionada
  const calcCreditFeeForSelected = () => {
    if (!selectedSale) return { fee: 0, liquid: 0 };
    if (selectedSale.paymentMethod !== 'cartao_credito') return { fee: 0, liquid: selectedSale.total };
    const fee = selectedSale.items.reduce((acc, item) => {
      const p = clothingItems.find(ci => ci.id === item.clothingItemId);
      const percent = Number(p?.creditFee) || 0;
      return acc + (item.totalPrice * (percent / 100));
    }, 0);
    const liquid = Math.max(0, selectedSale.total - fee);
    return { fee, liquid };
  };

  // Função para retornar peças ao estoque
  const returnItemsToInventory = async (saleItems: any[]) => {
    console.log('Retornando itens ao estoque:', saleItems);
    
    for (const saleItem of saleItems) {
      const clothingItem = clothingItems.find(item => item.id === saleItem.clothingItemId);
      if (clothingItem) {
        console.log('Atualizando item:', clothingItem.name);
        
        // Encontrar a variação correspondente
        const updatedVariations = clothingItem.variations.map(variation => {
          if (variation.id === saleItem.variationId) {
            return {
              ...variation,
              quantity: variation.quantity + saleItem.quantity
            };
          }
          return variation;
        });

        // Verificar se há variações disponíveis para atualizar o status
        const hasAvailableVariations = updatedVariations.some(v => v.quantity > 0);
        const newStatus = hasAvailableVariations ? 'available' : 'sold';

        await updateClothingItem(clothingItem.id, {
          variations: updatedVariations,
          status: newStatus
        });
        
        console.log('Item atualizado com sucesso:', clothingItem.name);
      }
    }
  };

  // Funções para exclusão
  const handleDeleteClick = (sale: Sale) => {
    if (isViewer()) {
      showViewerAlertForAction('excluir vendas do histórico');
      return;
    }
    setSaleToDelete(sale);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (saleToDelete) {
      try {
        // Primeiro, retornar as peças ao estoque
        await returnItemsToInventory(saleToDelete.items);
        
        // Depois, excluir a venda
        await deleteSale(saleToDelete.id);
        
        setShowDeleteModal(false);
        setSaleToDelete(null);
        setSuccessMessage('Venda excluída e peças retornadas ao estoque!');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (error) {
        console.error('Erro ao excluir venda:', error);
        setSuccessMessage('Erro ao excluir venda. Tente novamente.');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSaleToDelete(null);
  };

  // Função para edição - navega para aba de vendas
  const handleEditClick = (sale: Sale) => {
    if (isViewer()) {
      showViewerAlertForAction('editar vendas do histórico');
      return;
    }
    // Salvar a venda sendo editada no localStorage para a aba de vendas acessar
    localStorage.setItem('editingSale', JSON.stringify(sale));
    // Redirecionar para a aba de Vendas para edição
    setActiveTab('sales');
  };

  // Função para marcar venda como pendente
  const handleMarkAsPending = async (sale: Sale) => {
    if (isViewer()) {
      showViewerAlertForAction('alterar status das vendas');
      return;
    }
    try {
      await update(sale.id, {
        status: 'pendente',
        updatedAt: new Date()
      });
      
      setSuccessMessage('Venda marcada como pendente!');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Erro ao marcar venda como pendente:', error);
      setSuccessMessage('Erro ao atualizar venda. Tente novamente.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  // Marcar venda como paga
  const handleMarkAsPaid = async (sale: Sale) => {
    if (isViewer()) {
      showViewerAlertForAction('alterar status das vendas');
      return;
    }
    try {
      await update(sale.id, {
        status: 'pago',
        updatedAt: new Date()
      });
      setSuccessMessage('Venda marcada como paga!');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Erro ao marcar venda como paga:', error);
      setSuccessMessage('Erro ao atualizar venda. Tente novamente.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSale(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingSale(null);
  };

  const handleUpdateSale = async (updatedSale: Sale) => {
    try {
      await update(updatedSale.id, updatedSale);
      setShowEditModal(false);
      setEditingSale(null);
      alert('Venda atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      alert('Erro ao atualizar venda. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Erro ao carregar histórico de vendas: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-0 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 px-0">
        {/* Header Mobile */}
        <div className="block sm:hidden px-4" style={{ overflowX: 'hidden' }}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 mx-auto" style={{ width: 'clamp(320px, 92vw, 560px)', margin: '0 auto', marginLeft: '-20px' }}>
            <div className="block sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Histórico de Vendas</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Visualize e gerencie todas as vendas</p>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{totalSales} vendas encontradas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Desktop */}
        <div className="hidden sm:block">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Histórico de Vendas</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Visualize e gerencie todas as vendas</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{totalSales}</div>
                <div className="text-sm text-gray-600">vendas encontradas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas Mobile - Layout Corrigido */}
        <div className="block sm:hidden px-4" style={{ overflowX: 'hidden' }}>
          <div className="grid grid-cols-1 gap-3">
            {/* Card Total em Vendas - Mobile Layout */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 min-h-[60px] mx-auto" style={{ width: 'clamp(320px, 92vw, 560px)', margin: '0 auto', marginLeft: '-20px' }}>
              <div className="flex items-center">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-600">Total em Vendas</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 min-h-[60px] mx-auto" style={{ width: 'clamp(320px, 92vw, 560px)', margin: '0 auto', marginLeft: '-20px' }}>
              <div className="flex items-center">
                <div className="p-1.5 bg-yellow-100 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-600">Vendas Pendentes</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(pendingRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 min-h-[60px] mx-auto" style={{ width: 'clamp(320px, 92vw, 560px)', margin: '0 auto', marginLeft: '-20px' }}>
              <div className="flex items-center">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-600">Lucro Total</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(totalProfit)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 min-h-[60px] mx-auto" style={{ width: 'clamp(320px, 92vw, 560px)', margin: '0 auto', marginLeft: '-20px' }}>
              <div className="flex items-center">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-600">Total de Vendas</p>
                  <p className="text-sm font-bold text-gray-900">{totalSales}</p>
                </div>
              </div>
            </div>
        </div>
        </div>
        <div className="hidden sm:block">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 min-h-[72px] w-full">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total em Vendas</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 min-h-[72px] w-full">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Vendas Pendentes</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(pendingRevenue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 min-h-[72px] w-full">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Lucro Total</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(totalProfit)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 min-h-[72px] w-full">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Vendas</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{totalSales}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros Mobile */}
        <div className="block sm:hidden px-4" style={{ overflowX: 'hidden' }}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 mx-auto" style={{ width: 'clamp(320px, 92vw, 560px)', margin: '0 auto', marginLeft: '-20px' }}>
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg mr-3">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Filtros</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por cliente ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                />
              </div>

              {/* Filtro de Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border-2 border-gray-200 rounded-lg px-3 py-2 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="all">Todos os Status</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>

              {/* Filtro de Data */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="border-2 border-gray-200 rounded-lg px-3 py-2 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="all">Todas as Datas</option>
                <option value="today">Hoje</option>
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filtros Desktop */}
        <div className="hidden sm:block">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg mr-3">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Filtros</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por cliente ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                />
              </div>

              {/* Filtro de Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border-2 border-gray-200 rounded-lg px-3 py-2 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="all">Todos os Status</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>

              {/* Filtro de Data */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="border-2 border-gray-200 rounded-lg px-3 py-2 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="all">Todas as Datas</option>
                <option value="today">Hoje</option>
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Vendas Mobile */}
        <div className="block sm:hidden px-4" style={{ overflowX: 'hidden' }}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 mx-auto" style={{ width: 'clamp(320px, 92vw, 560px)', margin: '0 auto', marginLeft: '-20px' }}>
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg mr-3">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Vendas</h3>
            </div>

          {filteredSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg">Nenhuma venda encontrada</p>
              <p className="text-sm">Ajuste os filtros para ver mais resultados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSales.map(sale => (
                <div key={sale.id} className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="mb-2">
                        <div className="flex items-center gap-2">
                          {getPaymentIcon(sale.paymentMethod)}
                          <h4 className="font-bold text-gray-900 text-base break-words whitespace-normal">
                            {sale.customerName || 'Cliente não informado'}
                          </h4>
                        </div>
                        <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                          {sale.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 break-words">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDateOnly(sale.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span className="text-base sm:text-sm font-semibold text-green-600 break-words">{formatCurrency(getSaleNet(sale))}</span>
                        </div>
                        <div className="flex items-center">
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          {sale.items.length} item(s)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-1 sm:ml-4">
                      {getStatusIcon(sale.status)}
                      <button
                        onClick={() => handleViewSale(sale)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Visualizar venda"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(sale)}
                        className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                        title="Editar venda"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {sale.status === 'pago' && (
                        <button
                          onClick={() => handleMarkAsPending(sale)}
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                          title="Marcar como pendente"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                      )}
                      {sale.status === 'pendente' && (
                        <button
                          onClick={() => handleMarkAsPaid(sale)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Marcar como pago"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(sale)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Excluir venda"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Lista de Vendas Desktop */}
        <div className="hidden sm:block">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg mr-3">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Vendas</h3>
            </div>

            {filteredSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg">Nenhuma venda encontrada</p>
                <p className="text-sm">Ajuste os filtros para ver mais resultados</p>
              </div>
            ) : (
              <div className="space-y-3">
                  {filteredSales.map(sale => (
                    <div key={sale.id} className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                      {/* Layout Mobile - 5 linhas */}
                      <div className="block sm:hidden space-y-3">
                        {/* Linha 1: Nome do cliente e status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPaymentIcon(sale.paymentMethod)}
                            <h4 className="font-bold text-gray-900 text-base">
                              {sale.customerName || 'Cliente não informado'}
                            </h4>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sale.status)}`}>
                            {sale.status.toUpperCase()}
                          </span>
                        </div>
                        
                        {/* Linha 2: Data e horário */}
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                          <span className="text-sm text-gray-600 font-medium">{formatDateOnly(sale.createdAt)}</span>
                        </div>
                        
                        {/* Linha 3: Valor */}
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-600" />
                          <span className="text-lg font-bold text-green-600">{formatCurrency(getSaleNet(sale))}</span>
                        </div>
                        
                        {/* Linha 4: Quantidade de itens */}
                        <div className="flex items-center">
                          <ShoppingCart className="h-4 w-4 mr-2 text-gray-600" />
                          <span className="text-sm text-gray-600 font-medium">{sale.items.length} item(s)</span>
                        </div>
                        
                        {/* Linha 5: Botões de ação */}
                        <div className="flex items-center justify-center space-x-3 pt-2">
                          {getStatusIcon(sale.status)}
                          <button
                            onClick={() => handleViewSale(sale)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(sale)}
                            className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                            title="Editar venda"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {sale.status === 'pago' && (
                            <button
                              onClick={() => handleMarkAsPending(sale)}
                              className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                              title="Marcar como pendente"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          )}
                          {sale.status === 'pendente' && (
                            <button
                              onClick={() => handleMarkAsPaid(sale)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Marcar como pago"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(sale)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Excluir venda"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Layout Desktop - Original */}
                      <div className="hidden sm:block">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-2">
                              <div className="flex items-center gap-2 truncate">
                                {getPaymentIcon(sale.paymentMethod)}
                                <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                                  {sale.customerName || 'Cliente não informado'}
                                </h4>
                              </div>
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                                {sale.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDateOnly(sale.createdAt)}
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {formatCurrency(getSaleNet(sale))}
                              </div>
                              <div className="flex items-center">
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                {sale.items.length} item(s)
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-1 sm:ml-4">
                            {getStatusIcon(sale.status)}
                            <button
                              onClick={() => handleViewSale(sale)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(sale)}
                              className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                              title="Editar venda"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {sale.status === 'pago' && (
                              <button
                                onClick={() => handleMarkAsPending(sale)}
                                className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                                title="Marcar como pendente"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                            )}
                            {sale.status === 'pendente' && (
                              <button
                                onClick={() => handleMarkAsPaid(sale)}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Marcar como pago"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteClick(sale)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Excluir venda"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Detalhes da Venda */}
        {showModal && selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Detalhes da Venda</h3>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Informações da Venda */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Informações da Venda</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data:</span>
                        <span className="font-medium">{formatDateOnly(selectedSale.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSale.status)}`}>
                          {selectedSale.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Cliente</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nome:</span>
                        <span className="font-medium">{selectedSale.customerName || 'Não informado'}</span>
                      </div>
                      {selectedSale.customerPhone && (
                        <div className="flex justify-between mt-2">
                          <span className="text-gray-600">Telefone:</span>
                          <span className="font-medium text-blue-600">{selectedSale.customerPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Itens da Venda */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Itens Vendidos</h4>
                  <div className="space-y-2">
                    {selectedSale.items.map(item => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{item.clothingItemName}</h5>
                            <p className="text-sm text-gray-600">
                              {item.size} - {item.color} | Código: {item.clothingItemCode}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">Qtd: {item.quantity}</p>
                            <p className="text-sm text-gray-600">{formatCurrency(item.unitPrice)} cada</p>
                            <p className="font-bold text-green-600">{formatCurrency(item.totalPrice)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumo Financeiro */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Resumo Financeiro</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(selectedSale.subtotal)}</span>
                    </div>
                    {selectedSale.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Desconto:</span>
                        <span className="font-medium text-red-600">-{formatCurrency(selectedSale.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(selectedSale.total)}</span>
                    </div>
                    {(selectedSale.paymentMethod === 'cartao_credito' || selectedSale.paymentMethod === 'cartao_debito') && (() => {
                      const { fee, liquid } = calcCreditFeeForSelected();
                      return (
                        <div className="mt-2 p-3 bg-white/70 rounded-lg border border-blue-200">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Taxa do Cartão:</span>
                            <span className="font-medium text-red-600">-{formatCurrency(fee)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-800">Total Líquido (cartão):</span>
                            <span className="text-gray-900">{formatCurrency(liquid)}</span>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Forma de Pagamento:</span>
                      <span className="font-medium capitalize">{selectedSale.paymentMethod.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {selectedSale.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Observações</h4>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700">{selectedSale.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição da Venda */}
        {showEditModal && editingSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Editar Venda</h3>
                  <button
                    onClick={handleCloseEditModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status da Venda
                    </label>
                    <select
                      value={editingSale.status}
                      onChange={(e) => setEditingSale(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="pago">Pago</option>
                      <option value="pendente">Pendente</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  {/* Forma de Pagamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pagamento
                    </label>
                    <select
                      value={editingSale.paymentMethod}
                      onChange={(e) => setEditingSale(prev => prev ? { ...prev, paymentMethod: e.target.value as any } : null)}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="dinheiro">Dinheiro/PIX</option>
                      <option value="cartao_debito">Débito</option>
                      <option value="cartao_credito">Crédito</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome do Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Cliente
                    </label>
                    <input
                      type="text"
                      value={editingSale.customerName || ''}
                      onChange={(e) => setEditingSale(prev => prev ? { ...prev, customerName: toTitleCase(e.target.value) } : null)}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  {/* Campo Telefone removido */}
                </div>
                {/* Campo E-mail removido */}

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={editingSale.notes || ''}
                    onChange={(e) => setEditingSale(prev => prev ? { ...prev, notes: toTitleCase(e.target.value) } : null)}
                    rows={3}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleUpdateSale(editingSale)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteModal && saleToDelete && (
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
                    Tem certeza que deseja excluir a venda:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-semibold text-gray-900">Cliente: {saleToDelete.customerName}</div>
                    <div className="text-sm text-gray-600">Valor: {formatCurrency(saleToDelete.total)}</div>
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
                <div className="font-bold">{successMessage}</div>
                <div className="text-sm text-green-100">A operação foi concluída com sucesso</div>
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
    </div>
  );
}