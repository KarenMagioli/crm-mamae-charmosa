import { useMemo, useState } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, DollarSign, XCircle, TrendingUp, AlertTriangle, Clock, BarChart3, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#6b7280', '#3b82f6', '#10b981'];

function getDaysUntil(deadline: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(deadline); d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { sales, finance, products, production, leads, getProductName, getLeadName } = useCrm();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const years = useMemo(() => {
    const set = new Set<number>();
    set.add(now.getFullYear());
    sales.forEach(s => set.add(new Date(s.date).getFullYear()));
    finance.forEach(f => set.add(new Date(f.date).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [sales, finance]);

  const monthlySales = useMemo(() => sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && s.status !== 'cancelado';
  }), [sales, selectedMonth, selectedYear]);

  const totalSalesCount = monthlySales.length;
  const totalRevenue = monthlySales.reduce((sum, s) => sum + s.value, 0);
  const getProductCost = (id: string) => products.find(p => p.id === id)?.cost || 0;
  const totalProfit = monthlySales.reduce((sum, s) => sum + (s.value - getProductCost(s.productId)), 0);

  const productCount: Record<string, number> = {};
  monthlySales.forEach(s => { productCount[s.productId] = (productCount[s.productId] || 0) + 1; });
  const topProducts = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const monthlyFinance = useMemo(() => finance.filter(f => {
    const d = new Date(f.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  }), [finance, selectedMonth, selectedYear]);

  const entradas = monthlyFinance.filter(f => f.type === 'entrada').reduce((s, f) => s + f.value, 0);
  const saidas = monthlyFinance.filter(f => f.type === 'saida').reduce((s, f) => s + f.value, 0);
  const saldo = entradas - saidas;

  const urgentOrders = useMemo(() => production.filter(o => {
    if (o.status === 'entregue' || !o.deadline) return false;
    return getDaysUntil(o.deadline) <= 3;
  }).sort((a, b) => getDaysUntil(a.deadline) - getDaysUntil(b.deadline)), [production]);

  // Funnel stats from leads
  const totalClients = leads.length;
  const pedidosCancelamento = leads.filter(l => l.status === 'pedido_cancelamento').length;
  const cancelados = leads.filter(l => l.status === 'cancelado').length;
  const totalLeadValue = leads.filter(l => l.status !== 'cancelado' && l.status !== 'pedido_cancelamento').reduce((s, l) => s + (l.closingValue || 0), 0);
  const totalLostValue = leads.filter(l => l.status === 'cancelado').reduce((s, l) => s + (l.closingValue || 0), 0);
  const totalReembolso = leads.filter(l => l.status === 'cancelado' && l.reembolso === 'sim').reduce((s, l) => s + (l.closingValue || 0), 0);

  // Value lost by product
  const lostByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    leads.filter(l => l.status === 'cancelado' && l.productInterest).forEach(l => {
      const prod = l.productInterest;
      map[prod] = (map[prod] || 0) + (l.closingValue || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const topLostProduct = lostByProduct[0]?.name || '—';

  const cards = [
    { title: "Total no Funil", value: totalClients, icon: Users, color: "text-primary" },
    { title: "Ped. Cancelamento", value: pedidosCancelamento, icon: AlertTriangle, color: "text-amber-500" },
    { title: "Cancelados", value: cancelados, icon: XCircle, color: "text-destructive" },
    { title: "Vendas (mês)", value: totalSalesCount, icon: ShoppingBag, color: "text-emerald-500" },
    { title: "Faturamento (mês)", value: `R$ ${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: "text-emerald-500" },
    { title: "Valor Perdido", value: `R$ ${totalLostValue.toFixed(2)}`, icon: DollarSign, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Resumo geral e mensal</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[90px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {urgentOrders.length > 0 && (
        <Alert variant="destructive" className="border-orange-300 bg-orange-50 text-orange-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Prazos Próximos!</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-1">
              {urgentOrders.slice(0, 3).map(o => {
                const days = getDaysUntil(o.deadline);
                return (
                  <li key={o.id} className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">{getLeadName(o.leadId)}</span> — {getProductName(o.productId)} —
                    <span className="font-bold">{days < 0 ? `Atrasado ${Math.abs(days)}d` : days === 0 ? 'Hoje!' : `${days} dia(s)`}</span>
                  </li>
                );
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c) => (
          <Card key={c.title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lost value by product */}
      {lostByProduct.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Valor Perdido por Produto (Cancelamentos)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Produto com maior perda: <strong className="text-destructive">{topLostProduct}</strong> · Total perdido: <strong className="text-destructive">R$ {totalLostValue.toFixed(2)}</strong>
              {totalReembolso > 0 && <> · Reembolsos: <strong className="text-amber-600">R$ {totalReembolso.toFixed(2)}</strong></>}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(200, lostByProduct.length * 40)}>
              <BarChart data={lostByProduct} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tickFormatter={v => `R$ ${v}`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Bar dataKey="value" name="Valor perdido" radius={[0, 4, 4, 0]}>
                  {lostByProduct.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products sold */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Produtos Mais Vendidos</CardTitle></CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sem vendas neste período</p>
            ) : (
              <div className="space-y-2">
                {topProducts.map(([id, count], i) => {
                  const maxCount = topProducts[0][1];
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium truncate">{getProductName(id)}</span>
                          <span className="text-muted-foreground">{count}x</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly report */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">📋 Relatório Mensal — {MONTHS[selectedMonth]} {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Vendas</h4>
                <p className="text-sm">{totalSalesCount} venda(s) realizadas</p>
                <p className="text-sm">Faturamento: <span className="font-semibold text-emerald-600">R$ {totalRevenue.toFixed(2)}</span></p>
                <p className="text-sm">Lucro: <span className="font-semibold text-emerald-600">R$ {totalProfit.toFixed(2)}</span></p>
                {totalRevenue > 0 && <p className="text-xs text-muted-foreground mt-1">Margem: {((totalProfit / totalRevenue) * 100).toFixed(1)}%</p>}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Saldo Financeiro</h4>
                <div className="space-y-1">
                  <p className="text-sm">Entradas: <span className="font-semibold text-emerald-600">R$ {entradas.toFixed(2)}</span></p>
                  <p className="text-sm">Saídas: <span className="font-semibold text-destructive">R$ {saidas.toFixed(2)}</span></p>
                  <p className={`text-sm font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>Saldo: R$ {saldo.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
