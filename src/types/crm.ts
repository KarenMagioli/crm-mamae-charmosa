export type LeadStatus = 'lead_instagram' | 'primeiro_contato' | 'orcamento_enviado' | 'negociacao' | 'fechado_ganho' | 'pos_venda' | 'perdido';
export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao';
export type SaleStatus = 'pendente' | 'pago' | 'cancelado';
export type LostReason = 'preco_alto' | 'desistencia' | 'demora' | 'outro';
export type LeadLossReason = 'desistencia' | 'financeiro' | 'nao_informado' | 'insatisfacao' | 'outro';
export type ProductionStatus = 'em_producao' | 'pronto' | 'entregue';
export type FinanceType = 'entrada' | 'saida';
export type FinanceCategory = 'venda' | 'custo_material' | 'outros';
export type LeadOrigin = 'instagram' | 'indicacao' | 'whatsapp' | 'facebook' | 'outro';
export type CancellationStatus = 'em_analise' | 'aprovado' | 'negado';
export type ReembolsoOption = 'sim' | 'nao';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  origin: LeadOrigin;
  productInterest: string;
  status: LeadStatus;
  notes: string;
  createdAt: string;
  lossReason?: LeadLossReason;
  lossReasonDetail?: string;
}

export interface Product {
  id: string;
  name: string;
  cost: number;
  price: number;
}

export interface Sale {
  id: string;
  leadId: string;
  productId: string;
  value: number;
  date: string;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
}

export interface LostSale {
  id: string;
  leadId: string;
  productId: string;
  reason: LostReason;
  reasonDetail: string;
  date: string;
}

export interface ProductionOrder {
  id: string;
  leadId: string;
  productId: string;
  deadline: string;
  status: ProductionStatus;
}

export interface FinanceEntry {
  id: string;
  type: FinanceType;
  category: FinanceCategory;
  description: string;
  value: number;
  date: string;
  saleId?: string;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: 'Novo Lead',
  em_atendimento: 'Em Atendimento',
  orcamento_enviado: 'Orçamento Enviado',
  aguardando_resposta: 'Aguardando Resposta',
  fechado_ganho: 'Fechado - Ganho',
  perdido: 'Perdido',
};

export const ORIGIN_LABELS: Record<LeadOrigin, string> = {
  instagram: 'Instagram',
  indicacao: 'Indicação',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  outro: 'Outro',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
};

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  preco_alto: 'Preço Alto',
  desistencia: 'Desistência',
  demora: 'Demora',
  outro: 'Outro',
};

export const LEAD_LOSS_REASON_LABELS: Record<LeadLossReason, string> = {
  desistencia: 'Desistência',
  financeiro: 'Financeiro',
  nao_informado: 'Não Informado',
  insatisfacao: 'Insatisfação',
  outro: 'Outro',
};

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  em_producao: 'Em Produção',
  pronto: 'Pronto',
  entregue: 'Entregue',
};

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
};
