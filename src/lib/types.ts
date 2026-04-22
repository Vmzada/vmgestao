
export type UserRole = 'Admin' | 'Gerente' | 'Operador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
  createdAt: string;
}

export type UnitOfMeasure = 'un' | 'kg' | 'lt' | 'cx' | 'pct';

export interface Product {
  id: string;
  nome: string;
  sku: string;
  categoria: string;
  precoCusto: number;
  precoVenda: number;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  unidadeMedida: UnitOfMeasure;
  descricao?: string;
  fornecedor?: string;
  fotoUrl?: string;
  dataValidade?: string;
  localizacao?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'entrada' | 'saida' | 'ajuste' | 'venda' | 'cancelamento';

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  tipo: MovementType;
  quantidade: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
  motivo?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export type SaleStatus = 'concluida' | 'cancelada';

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  subtotal: number;
  desconto: number;
  formaPagamento: 'Dinheiro' | 'Cartão Débito' | 'Cartão Crédito' | 'PIX';
  userId: string;
  userName: string;
  status: SaleStatus;
  motivoCancelamento?: string;
  createdAt: string;
  canceledAt?: string;
}
