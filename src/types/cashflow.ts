export interface Movimento {
  id: string;
  data: Date;
  descricao: string;
  tipo: 'saida';
  origem: 'caixa' | 'embalagem';
  suborigem?: 'reinvestimento' | 'caixa_loja' | 'salario';
  valor: number;
  status?: 'pendente' | 'pago';
  createdAt: Date;
  updatedAt: Date;
}

export interface Venda {
  valorTotal: number;
  lucroReal: number;
  itens: Array<{
    joia: {
      custoEmbalagem?: number;
    };
    quantidade: number;
  }>;
}

export interface DivisaoCaixa {
  reinvestimento: number;
  caixaLoja: number;
  salarioMaria: number;
  salarioDaniel: number;
}
