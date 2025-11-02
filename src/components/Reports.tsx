import { useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, PieChart, Activity } from 'lucide-react';
import type { Sale, ClothingItem } from '../types';
import { useFirestore } from '../hooks/useFirestore';

export default function Reports() {
  const { data: sales, loading: salesLoading } = useFirestore<Sale>('sales');
  const { data: clothingItems, loading: clothingLoading } = useFirestore<ClothingItem>('clothing');
  // Removido dateFilter - usando todas as vendas para relatórios


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

  // Debug: Log dos dados quando o componente é montado
  useEffect(() => {
    console.log('Reports: Componente montado');
    console.log('Reports: Vendas carregadas:', sales.length);
    console.log('Reports: Itens carregados:', clothingItems.length);
    console.log('Reports: Sales loading:', salesLoading);
    console.log('Reports: Clothing loading:', clothingLoading);
  }, [sales, clothingItems, salesLoading, clothingLoading]);

  // Filtrar vendas por período - REMOVIDO (usando todas as vendas)
  // const getFilteredSales = () => { ... }; // Não usado - usando allSales

  // Calcular estatísticas gerais - USAR TODAS AS VENDAS, não apenas filtradas
  const allSales = sales; // Todas as vendas
  // Receita líquida: descontar taxa do cartão quando pagamento for cartao_credito
  const getSaleNet = (sale: Sale) => {
    if (sale.paymentMethod !== 'cartao_credito' && sale.paymentMethod !== 'cartao_debito') return sale.total;
    const fee = sale.items.reduce((acc, item) => {
      const p = clothingItems.find(ci => ci.id === item.clothingItemId);
      const percent = Number(p?.creditFee) || 0;
      return acc + (item.totalPrice * (percent / 100));
    }, 0);
    return Math.max(0, sale.total - fee);
  };

  const totalRevenue = allSales.reduce((sum, sale) => sum + getSaleNet(sale), 0);
  const totalSales = allSales.length;
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  // Calcular lucro real baseado nos custos das peças
  const calculateRealProfit = () => {
    let totalCost = 0;
    let totalRevenueNet = 0;
    
    allSales.forEach(sale => {
      sale.items.forEach(item => {
        const clothingItem = clothingItems.find(ci => ci.id === item.clothingItemId);
        if (clothingItem) {
          // Calcular quantidade total de peças para obter frete unitário
          const totalPieces = clothingItem.variations.reduce((sum, variation) => {
            return sum + (variation.quantity || 0) + (variation.soldQuantity || 0);
          }, 0);
          
          // Calcular frete unitário (frete total dividido pela quantidade total de peças)
          const freightPerUnit = totalPieces > 0 ? (clothingItem.freightCost || 0) / totalPieces : 0;
          
          // Custo real da peça (custo + frete unitário + extras + embalagem)
          const realCost = clothingItem.costPrice + freightPerUnit + (clothingItem.extraCosts || 0) + (clothingItem.packagingCost || 0);
          totalCost += realCost * item.quantity;
          // Receita líquida por item (se crédito, abate taxa % sobre o valor do item)
          const feePercent = (sale.paymentMethod === 'cartao_credito' || sale.paymentMethod === 'cartao_debito') ? (Number(clothingItem.creditFee) || 0) : 0;
          const itemNet = item.totalPrice - (item.totalPrice * (feePercent / 100));
          totalRevenueNet += itemNet;
        }
      });
    });
    
    return totalRevenueNet - totalCost;
  };
  
  const realProfit = calculateRealProfit();

  // Vendas por status - USAR TODAS AS VENDAS
  const salesByStatus = {
    pago: allSales.filter(sale => sale.status === 'pago').length,
    pendente: allSales.filter(sale => sale.status === 'pendente').length,
  };

  // Vendas por forma de pagamento - USAR TODAS AS VENDAS
  const salesByPayment = {
    dinheiro: allSales.filter(sale => sale.paymentMethod === 'dinheiro' || sale.paymentMethod === 'pix').length,
    cartao_debito: allSales.filter(sale => sale.paymentMethod === 'cartao_debito').length,
    cartao_credito: allSales.filter(sale => sale.paymentMethod === 'cartao_credito').length,
  };

  // Produtos mais vendidos - USAR TODAS AS VENDAS
  const getTopProducts = () => {
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    
    allSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.clothingItemId]) {
          productSales[item.clothingItemId] = {
            name: item.clothingItemName,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.clothingItemId].quantity += item.quantity;
        const ci = clothingItems.find(ci => ci.id === item.clothingItemId);
        const percent = (sale.paymentMethod === 'cartao_credito' || sale.paymentMethod === 'cartao_debito') ? (Number(ci?.creditFee) || 0) : 0;
        const net = item.totalPrice - (item.totalPrice * (percent / 100));
        productSales[item.clothingItemId].revenue += net;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const topProducts = getTopProducts();


  // Estatísticas de estoque — contagem de peças (não variações)
  const getStockStats = () => {
    // Peças disponíveis: quantity atual (já descontadas as vendas)
    const availableItems = clothingItems.reduce((sum, item) => {
      return sum + item.variations.reduce((itemSum, variation) => {
        return itemSum + variation.quantity;
      }, 0);
    }, 0);

    // Peças vendidas: baseado no soldQuantity
    const soldItems = clothingItems.reduce((sum, item) => {
      // Para visualizador (dados demo), usar soldQuantity das variações
      if (isViewer()) {
        return sum + item.variations.reduce((itemSum, variation) => {
          return itemSum + ((variation as any).soldQuantity || 0);
        }, 0);
      } else {
        // Para admin/usuário (dados reais), calcular vendas baseado na coleção sales
        return sum + getSoldQuantityForItem(item.id);
      }
    }, 0);

    // Total de peças = disponíveis + vendidas
    const totalItems = availableItems + soldItems;

    return {
      totalItems,
      availableItems,
      soldItems,
    };
  };

  // Estatísticas por categoria — contagem de peças (disponíveis vs vendidas) baseada no estoque
  const getCategoryStats = () => {
    const categoryStats: { [key: string]: { name: string; available: number; sold: number } } = {};

    clothingItems.forEach(item => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { name: item.category, available: 0, sold: 0 };
      }
      
      // Calcular peças disponíveis (quantity atual)
      item.variations.forEach(variation => {
        categoryStats[item.category].available += variation.quantity;
      });
      
      // Calcular peças vendidas
      if (isViewer()) {
        // Para visualizador (dados demo), usar soldQuantity das variações
        item.variations.forEach(variation => {
          categoryStats[item.category].sold += ((variation as any).soldQuantity || 0);
        });
      } else {
        // Para admin/usuário (dados reais), calcular vendas baseado na coleção sales
        const soldQuantity = getSoldQuantityForItem(item.id);
        categoryStats[item.category].sold += soldQuantity;
      }
    });

    return Object.values(categoryStats).sort((a, b) => (b.available + b.sold) - (a.available + a.sold));
  };

  const stockStats = getStockStats();
  const categoryStats = getCategoryStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Mostrar loading se os dados ainda estão carregando
  if (salesLoading || clothingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 text-lg">Carregando relatórios...</p>
            <p className="text-sm text-gray-500">Aguarde enquanto os dados são atualizados</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Relatórios</h2>
                <p className="text-xs sm:text-sm text-gray-600">Análise completa de vendas e estoque</p>
              </div>
            </div>
            {/* Filtro de data removido - relatórios mostram todos os dados */}
          </div>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Faturamento</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Lucro Real</p>
                <p className={`text-base sm:text-lg font-bold ${realProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(realProfit)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Vendas</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">{totalSales}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(averageTicket)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Vendas por Status */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg mr-3">
                <PieChart className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Vendas por Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Pago</span>
                </div>
                <span className="text-base sm:text-lg font-bold text-green-600">{salesByStatus.pago}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Pendente</span>
                </div>
                <span className="text-base sm:text-lg font-bold text-yellow-600">{salesByStatus.pendente}</span>
              </div>
            </div>
          </div>

          {/* Vendas por Forma de Pagamento */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg mr-3">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Forma de Pagamento</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Dinheiro/PIX</span>
                </div>
                <span className="text-base sm:text-lg font-bold text-green-600">{salesByPayment.dinheiro}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Débito</span>
                </div>
                <span className="text-base sm:text-lg font-bold text-purple-600">{salesByPayment.cartao_debito}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Crédito</span>
                </div>
                <span className="text-base sm:text-lg font-bold text-orange-600">{salesByPayment.cartao_credito}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Produtos Mais Vendidos */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg mr-3">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Produtos Mais Vendidos</h3>
          </div>
          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={index} className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{product.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">{product.quantity} unidades vendidas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base sm:text-lg font-bold text-green-600">{formatCurrency(product.revenue)}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Faturamento</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg">Nenhum produto vendido no período</p>
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas de Estoque (contagem de peças) */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg mr-3">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Estatísticas de Estoque</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{stockStats.totalItems}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total de Peças</div>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{stockStats.availableItems}</div>
                <div className="text-xs sm:text-sm text-gray-600">Disponíveis</div>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">{stockStats.soldItems}</div>
                <div className="text-xs sm:text-sm text-gray-600">Vendidas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas por Categoria */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg mr-3">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Estatísticas por Categoria</h3>
          </div>
          <div className="space-y-3">
            {categoryStats.length > 0 ? (
              categoryStats.map((category, index) => (
                <div key={index} className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-indigo-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{category.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">Categoria de produtos</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 sm:space-x-6">
                      <div className="text-center">
                        <p className="text-base sm:text-lg font-bold text-green-600">{category.available}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Disponíveis</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base sm:text-lg font-bold text-orange-600">{category.sold}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Vendidos</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg">Nenhuma categoria encontrada</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}