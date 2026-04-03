import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Lead, Product, Sale, LostSale, ProductionOrder, FinanceEntry, CancellationRequest } from '@/types/crm';

interface CrmState {
  leads: Lead[];
  products: Product[];
  sales: Sale[];
  lostSales: LostSale[];
  production: ProductionOrder[];
  finance: FinanceEntry[];
  cancellations: CancellationRequest[];
}

interface CrmContextType extends CrmState {
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLead: (lead: Lead) => void;
  deleteLead: (id: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addSale: (sale: Omit<Sale, 'id'>) => void;
  updateSale: (sale: Sale) => void;
  deleteSale: (id: string) => void;
  addLostSale: (ls: Omit<LostSale, 'id'>) => void;
  addProductionOrder: (order: Omit<ProductionOrder, 'id'>) => void;
  updateProductionOrder: (order: ProductionOrder) => void;
  deleteProductionOrder: (id: string) => void;
  addFinanceEntry: (entry: Omit<FinanceEntry, 'id'>) => void;
  deleteFinanceEntry: (id: string) => void;
  addCancellation: (c: Omit<CancellationRequest, 'id'>) => void;
  updateCancellation: (c: CancellationRequest) => void;
  deleteCancellation: (id: string) => void;
  getLeadName: (id: string) => string;
  getProductName: (id: string) => string;
}

const CrmContext = createContext<CrmContextType | null>(null);

const uid = () => crypto.randomUUID();

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(() => load('crm_leads', []));
  const [products, setProducts] = useState<Product[]>(() => load('crm_products', []));
  const [sales, setSales] = useState<Sale[]>(() => load('crm_sales', []));
  const [lostSales, setLostSales] = useState<LostSale[]>(() => load('crm_lostSales', []));
  const [production, setProduction] = useState<ProductionOrder[]>(() => load('crm_production', []));
  const [finance, setFinance] = useState<FinanceEntry[]>(() => load('crm_finance', []));
  const [cancellations, setCancellations] = useState<CancellationRequest[]>(() => load('crm_cancellations', []));

  useEffect(() => { localStorage.setItem('crm_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('crm_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('crm_sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('crm_lostSales', JSON.stringify(lostSales)); }, [lostSales]);
  useEffect(() => { localStorage.setItem('crm_production', JSON.stringify(production)); }, [production]);
  useEffect(() => { localStorage.setItem('crm_finance', JSON.stringify(finance)); }, [finance]);
  useEffect(() => { localStorage.setItem('crm_cancellations', JSON.stringify(cancellations)); }, [cancellations]);

  const getLeadName = useCallback((id: string) => leads.find(l => l.id === id)?.name || 'Desconhecido', [leads]);
  const getProductName = useCallback((id: string) => products.find(p => p.id === id)?.name || 'Desconhecido', [products]);

  const value: CrmContextType = {
    leads, products, sales, lostSales, production, finance, cancellations,
    getLeadName, getProductName,
    addLead: (l) => setLeads(prev => [...prev, { ...l, id: uid(), createdAt: new Date().toISOString() }]),
    updateLead: (l) => setLeads(prev => prev.map(x => x.id === l.id ? l : x)),
    deleteLead: (id) => setLeads(prev => prev.filter(x => x.id !== id)),
    addProduct: (p) => setProducts(prev => [...prev, { ...p, id: uid() }]),
    updateProduct: (p) => setProducts(prev => prev.map(x => x.id === p.id ? p : x)),
    deleteProduct: (id) => setProducts(prev => prev.filter(x => x.id !== id)),
    addSale: (s) => setSales(prev => [...prev, { ...s, id: uid() }]),
    updateSale: (s) => setSales(prev => prev.map(x => x.id === s.id ? s : x)),
    deleteSale: (id) => setSales(prev => prev.filter(x => x.id !== id)),
    addLostSale: (ls) => setLostSales(prev => [...prev, { ...ls, id: uid() }]),
    addProductionOrder: (o) => setProduction(prev => [...prev, { ...o, id: uid() }]),
    updateProductionOrder: (o) => setProduction(prev => prev.map(x => x.id === o.id ? o : x)),
    deleteProductionOrder: (id) => setProduction(prev => prev.filter(x => x.id !== id)),
    addFinanceEntry: (e) => setFinance(prev => [...prev, { ...e, id: uid() }]),
    deleteFinanceEntry: (id) => setFinance(prev => prev.filter(x => x.id !== id)),
    addCancellation: (c) => setCancellations(prev => [...prev, { ...c, id: uid() }]),
    updateCancellation: (c) => setCancellations(prev => prev.map(x => x.id === c.id ? c : x)),
    deleteCancellation: (id) => setCancellations(prev => prev.filter(x => x.id !== id)),
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used within CrmProvider');
  return ctx;
}
