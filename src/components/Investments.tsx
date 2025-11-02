import { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Target, Package, BarChart3, Filter, ShoppingCart, X, Eye } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import type { Investment, ClothingItem, Sale } from '../types';

export default function Investments() {
  const { data: clothingItems, loading: clothingLoading, initialized: clothingInitialized } = useFirestore<ClothingItem>('clothing');
  const { data: sales, loading: salesLoading, initialized: salesInitialized } = useFirestore<Sale>('sales');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | Investment['status']>('all');
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [showVariations, setShowVariations] = useState(false);

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

  // Calcular investimentos (lotes) baseados nas peças cadastradas
  const investments = useMemo(() => {
    console.log('Investments: Recalculando investimentos - vendas:', sales.length, 'peças:', clothingItems.length);
    const lotMap = new Map<string, {
      supplier: string;
      date: Date;
      items: ClothingItem[];
      totalCost: number;
      totalSold: number;
      soldItems: number;
    }>();

    // Agrupar peças por fornecedor e data
    clothingItems.forEach(item => {
      // Garantir que createdAt seja um objeto Date válido
      let createdAt: Date;
      if (item.createdAt instanceof Date) {
        createdAt = item.createdAt;
      } else {
        const parsedDate = new Date(item.createdAt);
        // Se a data for inválida, usar data atual
        createdAt = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      }
      
      const key = `${item.supplier}-${createdAt.toDateString()}`;
      
      if (!lotMap.has(key)) {
        lotMap.set(key, {
          supplier: item.supplier,
          date: createdAt,
          items: [],
          totalCost: 0,
          totalSold: 0,
          soldItems: 0
        });
      }

      const lot = lotMap.get(key)!;
      lot.items.push(item);
      // Não calcular totalCost aqui - será calculado depois considerando todas as variações
    });

    // Calcular vendas para cada lote baseado no soldQuantity das variações
    clothingItems.forEach(item => {
      // Garantir que createdAt seja um objeto Date válido
      let createdAt: Date;
      if (item.createdAt instanceof Date) {
        createdAt = item.createdAt;
      } else {
        const parsedDate = new Date(item.createdAt);
        // Se a data for inválida, usar data atual
        createdAt = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      }
      const key = `${item.supplier}-${createdAt.toDateString()}`;
      const lot = lotMap.get(key);
      if (lot) {
        // Calcular vendas baseado no soldQuantity das variações
        item.variations.forEach(variation => {
          // Para dados demo (com soldQuantity), usar soldQuantity
          if (typeof (variation as any).soldQuantity === 'number' && (variation as any).soldQuantity > 0) {
            lot.totalSold += item.sellingPrice * (variation as any).soldQuantity;
            lot.soldItems += (variation as any).soldQuantity;
            console.log('Investments: Atualizando lote', key, 'com venda:', item.sellingPrice * (variation as any).soldQuantity, 'quantidade:', (variation as any).soldQuantity);
          }
        });
      }
    });

    // Calcular vendas reais baseadas nos dados de vendas para cada lote
    clothingItems.forEach(item => {
      // Garantir que createdAt seja um objeto Date válido
      let createdAt: Date;
      if (item.createdAt instanceof Date) {
        createdAt = item.createdAt;
      } else {
        const parsedDate = new Date(item.createdAt);
        // Se a data for inválida, usar data atual
        createdAt = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      }
      const key = `${item.supplier}-${createdAt.toDateString()}`;
      const lot = lotMap.get(key);
      if (lot) {
        // Buscar vendas para este item específico
        const itemSales = sales.filter(sale => 
          sale.items.some(saleItem => saleItem.clothingItemId === item.id)
        );
        
        // Calcular total vendido para este item
        const itemTotalSold = itemSales.reduce((total, sale) => {
          return total + sale.items.reduce((saleTotal, saleItem) => {
            if (saleItem.clothingItemId !== item.id) return saleTotal;
            const percent = (sale.paymentMethod === 'cartao_credito' || sale.paymentMethod === 'cartao_debito') ? (Number(item.creditFee) || 0) : 0;
            const net = saleItem.totalPrice - (saleItem.totalPrice * (percent / 100));
            return saleTotal + net;
          }, 0);
        }, 0);
        
        // Adicionar ao total do lote se ainda não foi calculado via soldQuantity
        if (lot.totalSold === 0 && itemTotalSold > 0) {
          lot.totalSold += itemTotalSold;
          console.log('Investments: Adicionando vendas reais para lote', key, 'valor:', itemTotalSold);
        }
      }
    });

    // Converter para array de investimentos
    return Array.from(lotMap.entries()).map(([key, lot]) => {
      console.log(`DEBUG LOTE ${key}:`, {
        'Quantidade de itens': lot.items.length,
        'Itens': lot.items.map(item => ({ name: item.name, variations: item.variations.length }))
      });
      
      // CORREÇÃO 1: Valor investido = Custo Base × quantidade total de peças (sem taxa de crédito)
      const totalInvestedValue = lot.items.reduce((sum, item) => {
        // Calcular Custo Base por peça (sem taxa de crédito)
        const freightPerUnit = (item.freightCost || 0) / (item.freightQuantity || 1);
        const baseCost = item.costPrice + freightPerUnit + (item.extraCosts || 0);
        
        // Multiplicar pela quantidade total de peças (soma de todas as variações)
        // CORREÇÃO: Usar quantidade original (atual + vendidas) para cálculo do investimento
        const totalPieces = item.variations.reduce((itemSum, variation) => {
          // Calcular vendas para esta variação específica
          const soldQuantity = (() => {
            if (sales && sales.length > 0) {
              return sales.reduce((total, sale) => {
                return total + sale.items.reduce((saleTotal, saleItem) => {
                  return saleTotal + (saleItem.clothingItemId === item.id && saleItem.variationId === variation.id ? saleItem.quantity : 0);
                }, 0);
              }, 0);
            } else {
              return (variation as any).soldQuantity || 0;
            }
          })();
          
          // Total original = quantidade atual + vendidas
          const totalOriginal = variation.quantity + soldQuantity;
          console.log(`  Variação ${variation.color}: atual=${variation.quantity}, vendidas=${soldQuantity}, total=${totalOriginal}`);
          return itemSum + totalOriginal;
        }, 0);
        
        const itemValue = baseCost * totalPieces;
        console.log(`DEBUG INVESTIMENTO ${item.name}:`, {
          costPrice: item.costPrice,
          freightCost: item.freightCost,
          freightQuantity: item.freightQuantity,
          extraCosts: item.extraCosts,
          freightPerUnit,
          baseCost,
          totalPieces,
          itemValue,
          'Valor por peça': totalPieces > 0 ? (itemValue / totalPieces).toFixed(2) : 0
        });
        
        return sum + itemValue;
      }, 0);

      // CORREÇÃO 2: Valor vendido = calcular baseado em vendas reais se necessário
      let totalSoldValue = lot.totalSold;
      
      // Se não há vendas calculadas (dados reais), calcular baseado nas vendas reais
      if (totalSoldValue === 0) {
        totalSoldValue = lot.items.reduce((sum, item) => {
          return sum + item.variations.reduce((itemSum, variation) => {
            // Para dados demo (com soldQuantity), usar soldQuantity
            if (typeof (variation as any).soldQuantity === 'number') {
              return itemSum + (item.sellingPrice * (variation as any).soldQuantity);
            } else {
              // Para dados reais, calcular vendas baseado no valor total das vendas (com desconto)
              const itemSales = sales.filter(sale => 
                sale.items.some(saleItem => saleItem.clothingItemId === item.id)
              );
              
              const itemTotalSold = itemSales.reduce((total, sale) => {
                return total + sale.items.reduce((saleTotal, saleItem) => {
                  return saleTotal + (saleItem.clothingItemId === item.id ? saleItem.totalPrice : 0);
                }, 0);
              }, 0);
              
              return itemSum + itemTotalSold;
            }
          }, 0);
        }, 0);
      }

      // CORREÇÃO 3: Lucro obtido = apenas quando há vendas do lote
      const profit = totalSoldValue > 0 ? totalSoldValue - totalInvestedValue : 0;

      // CORREÇÃO 4 (ATUALIZADA): Progresso baseado em TOTAL ORIGINAL DE PEÇAS
      // totalPieces: soma do total original (disponíveis + vendidas) para evitar extrapolação
      const totalPieces = lot.items.reduce((sum, item) => {
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
      }, 0);
      // soldPieces: soma das quantidades vendidas
      const soldPieces = lot.items.reduce((sum, item) => {
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
      const progress = totalPieces > 0 ? (soldPieces / totalPieces) * 100 : 0;
      
      console.log('Investments: Lote', key, '- Peças totais:', totalPieces, 'Peças vendidas:', soldPieces, 'Progresso:', progress.toFixed(2) + '%');
      console.log('  Valor investido:', totalInvestedValue, 'Valor vendido:', totalSoldValue, 'Lucro:', profit);
      
      // CORREÇÃO 5 (ATUALIZADA): Status/Rotulagem conforme regras solicitadas
      // - "Finalizado" quando vender todas as peças (progress === 100)
      // - "Recuperado" quando totalSoldValue > totalInvestedValue
      // - Caso contrário, "Em andamento"
      let status: Investment['status'] = 'yellow';
      if (progress >= 100) {
        status = 'green';
      } else if (totalSoldValue > totalInvestedValue) {
        status = 'green'; // usaremos a cor via mapeamento textual; o texto será "Recuperado"
      } else {
        status = 'yellow';
      }

      console.log(`DEBUG INVESTIMENTO FINAL ${key}:`, {
        totalInvestedValue,
        totalSoldValue,
        profit,
        totalPieces,
        soldPieces,
        'Valor por peça': totalPieces > 0 ? (totalInvestedValue / totalPieces).toFixed(2) : 0
      });
      
      return {
        id: key,
        supplier: lot.supplier,
        date: lot.date,
        totalItems: totalPieces, // Total de peças do lote
        soldItems: soldPieces, // Peças vendidas
        totalCost: totalInvestedValue, // Valor investido = custo + frete
        totalSold: totalSoldValue, // Valor vendido = apenas quando há vendas
        profit, // Lucro = apenas quando há vendas
        progress,
        status,
        createdAt: lot.date,
        updatedAt: new Date(),
        items: lot.items // Adicionar os itens do lote
      } as Investment;
    });
  }, [clothingItems, sales]);

  // Filtrar e ordenar investimentos
  const filteredInvestments = investments
    .filter(investment => {
      const matchesSupplier = filterSupplier === 'all' || investment.supplier === filterSupplier;
      const matchesStatus = filterStatus === 'all' || investment.status === filterStatus;
      return matchesSupplier && matchesStatus;
    })
    .sort((a, b) => {
      // CORREÇÃO: Investimentos pagos (100%) vão para o final
      if (a.progress >= 100 && b.progress < 100) return 1;
      if (a.progress < 100 && b.progress >= 100) return -1;
      
      // Ordenar por data (mais recente primeiro)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Calcular estatísticas gerais - CORRIGIDO: apenas peças vendidas
  const totalInvested = investments.reduce((sum, inv) => sum + inv.totalCost, 0);
  const totalSold = investments.reduce((sum, inv) => sum + inv.totalSold, 0);
  // CORREÇÃO: Lucro total apenas das peças vendidas (não do estoque)
  const totalProfit = investments.reduce((sum, inv) => sum + inv.profit, 0);
  const totalItems = investments.reduce((sum, inv) => sum + inv.totalItems, 0);
  const totalSoldItems = investments.reduce((sum, inv) => sum + inv.soldItems, 0);

  // Obter fornecedores únicos
  const suppliers = Array.from(new Set(investments.map(inv => inv.supplier)));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      // Verificar se a data é válida
      if (isNaN(dateObj.getTime())) {
        return 'Data inválida';
      }
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(dateObj);
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getProgressColor = (status: Investment['status']) => {
    switch (status) {
      case 'red':
        return 'bg-red-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'green':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (inv: { totalSold: number; totalCost: number; progress: number }) => {
    // Regras de exibição:
    // - Remover "Inicial"
    // - Mostrar "Recuperado" quando totalSold > totalCost
    // - Mostrar "Finalizado" quando progress === 100%
    // - Caso contrário, "Em andamento"
    if (inv.progress >= 100) return 'Finalizado';
    if (inv.totalSold > inv.totalCost) return 'Recuperado';
    return 'Em andamento';
  };

  const getStatusColor = (status: Investment['status']) => {
    switch (status) {
      case 'red':
        return 'bg-red-100 text-red-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'green':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Mostrar loading se os dados ainda estão carregando
  if (clothingLoading || salesLoading || !clothingInitialized || !salesInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 text-lg">Carregando investimentos...</p>
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
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Investimentos</h2>
                <p className="text-xs sm:text-sm text-gray-600">Controle de lotes de produtos por fornecedor</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{investments.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">lotes cadastrados</div>
            </div>
          </div>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Investido</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalInvested)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Vendido</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalSold)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Lucro Total</p>
                <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total de Peças</p>
                <p className="text-lg font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Target className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Peças Vendidas</p>
                <p className="text-lg font-bold text-gray-900">{totalSoldItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg mr-3">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fornecedor</label>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
              >
                <option value="all">Todos os Fornecedores</option>
                {suppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
              >
                <option value="all">Todos os Status</option>
                <option value="red">Inicial (0-45%)</option>
                <option value="yellow">Recuperando (45-100%)</option>
                <option value="green">Investimento Pago</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Investimentos */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg mr-3">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Lotes de Investimento</h3>
          </div>
          <div className="space-y-4">
            {filteredInvestments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg">Nenhum lote encontrado</p>
                <p className="text-sm">Cadastre peças para ver os lotes de investimento</p>
              </div>
            ) : (
              filteredInvestments.map(investment => (
                <div key={investment.id} className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900 text-base sm:text-lg truncate max-w-[60vw]">{investment.supplier}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(investment.status)}`}>
                        {getStatusText({ totalSold: investment.totalSold, totalCost: investment.totalCost, progress: investment.progress })}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Cadastrado dia {formatDate(investment.date)}</p>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progresso de Venda</span>
                      <span className="text-sm font-bold text-gray-900">{investment.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(investment.status)}`}
                        style={{ width: `${Math.min(investment.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Informações do Lote */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                      <div className="flex items-center mb-1">
                        <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Valor Investido</span>
                      </div>
                      <p className="text-base sm:text-lg font-bold text-blue-600">{formatCurrency(investment.totalCost)}</p>
                    </div>

                    <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                      <div className="flex items-center mb-1">
                        <ShoppingCart className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Valor Vendido</span>
                      </div>
                      <p className="text-base sm:text-lg font-bold text-green-600">{formatCurrency(investment.totalSold)}</p>
                    </div>

                    <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                      <div className="flex items-center mb-1">
                        <TrendingUp className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Lucro Obtido</span>
                      </div>
                      <p className={`text-base sm:text-lg font-bold ${investment.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}> 
                        {formatCurrency(investment.profit)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                      <div className="flex items-center mb-1">
                        <Package className="h-4 w-4 text-orange-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Peças</span>
                      </div>
                      <p className="text-base sm:text-lg font-bold text-orange-600">
                        {investment.soldItems}/{investment.totalItems}
                      </p>
                    </div>
                  </div>

                  {/* Botão para visualizar variações */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedInvestment(investment);
                        setShowVariations(true);
                      }}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-200 group"
                      title="Ver variações do lote"
                    >
                      <Eye className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal para visualizar variações */}
      {showVariations && selectedInvestment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <Eye className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold">
                      Variações do Lote
                    </h3>
                    <p className="text-blue-100 text-xs sm:text-sm">
                      {selectedInvestment.supplier} • Cadastrado em {formatDate(selectedInvestment.date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVariations(false)}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Conteúdo do Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                {selectedInvestment.items && selectedInvestment.items.length > 0 ? (
                  selectedInvestment.items.map((item: any, itemIndex: number) => (
                  <div key={itemIndex} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 sm:p-5 border border-gray-200">
                    {/* Header do Item */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base sm:text-lg">{item.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 break-all">Código: {item.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-gray-600">Preço de Venda</p>
                        <p className="text-base sm:text-lg font-bold text-green-600">
                          R$ {item.sellingPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Grid de Variações */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                      {item.variations.map((variation: any, varIndex: number) => {
                        // Calcular vendas específicas desta variação
                        let soldQuantity = 0;
                        
                        console.log(`\n=== DEBUG Variação ${variation.size.displayName} ${variation.color} ===`);
                        console.log('Item ID:', item.id);
                        console.log('Variação size:', variation.size.displayName);
                        console.log('Variação color:', variation.color);
                        console.log('Variação tem soldQuantity?', typeof (variation as any).soldQuantity);
                        console.log('Total de vendas:', sales.length);
                        
                        // Para dados demo (com soldQuantity), usar soldQuantity da variação
                        if (isViewer() && typeof (variation as any).soldQuantity === 'number') {
                          soldQuantity = (variation as any).soldQuantity;
                          console.log('Usando soldQuantity da variação (DEMO):', soldQuantity);
                        } else {
                          // Para dados reais, calcular vendas específicas desta variação
                          sales.forEach((sale, saleIndex) => {
                            console.log(`\nVenda ${saleIndex + 1}:`);
                            sale.items.forEach((saleItem, itemIndex) => {
                              console.log(`  Item ${itemIndex + 1}:`);
                              console.log(`    clothingItemId: ${saleItem.clothingItemId}`);
                              console.log(`    size: ${saleItem.size}`);
                              console.log(`    color: ${saleItem.color}`);
                              console.log(`    quantity: ${saleItem.quantity}`);
                              
                              if (saleItem.clothingItemId === item.id && 
                                  saleItem.size === variation.size.displayName &&
                                  saleItem.color === variation.color) {
                                console.log(`    ✅ MATCH! Adicionando ${saleItem.quantity} vendidas`);
                                soldQuantity += saleItem.quantity;
                              }
                            });
                          });
                        }
                        
                        console.log(`Total vendido para esta variação: ${soldQuantity}`);
                        
                        // CORREÇÃO: variation.quantity já é a quantidade atual (já descontadas as vendas)
                        // Disponível = quantidade atual (não precisa subtrair vendas novamente)
                        const availableQuantity = variation.quantity;
                        
                        // CORREÇÃO: Status "Vendida" só quando NÃO há peças disponíveis (availableQuantity = 0)
                        const status = availableQuantity === 0 ? 'Vendida' : 'Disponível';
                        const statusColor = availableQuantity === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
                        const statusIcon = availableQuantity === 0 ? '✓' : '○';
                        
                        // Total é calculado diretamente no JSX: availableQuantity + soldQuantity
                        
                        return (
                          <div key={varIndex} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                            {/* Header da Variação */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-base sm:text-lg">{statusIcon}</span>
                                <span className="font-semibold text-gray-900 text-sm">
                                  {variation.size.displayName}
                                </span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                {status}
                              </span>
                            </div>
                            
                            {/* Cor */}
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">Cor</p>
                              <p className="font-medium text-gray-900 break-words">{variation.color}</p>
                            </div>
                            
                            {/* Quantidades */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Disponível</span>
                                <span className={`font-bold ${availableQuantity > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                  {availableQuantity}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Vendida</span>
                                <span className={`font-bold ${soldQuantity > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                  {soldQuantity}
                                </span>
                              </div>
                              <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                                <span className="text-xs text-gray-500 font-medium">Total</span>
                                <span className="font-bold text-gray-900">{availableQuantity + soldQuantity}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg">Nenhum item encontrado neste lote</p>
                    <p className="text-sm">Os itens podem ter sido removidos ou não estão disponíveis</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}