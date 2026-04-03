import { useMemo, useState } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, DollarSign, XCircle, TrendingUp, AlertTriangle, Clock, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LOST_REASON_LABELS, LEAD_LOSS_REASON_LABELS } from "@/types/crm";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getDaysUntil(deadline: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(deadline); d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { sales, lostSales, finance, products, production, leads, cancellations, getProductName, getLeadName } = useCrm();

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

  const monthlyLost = useMemo(() => lostSales.filter(ls => {
    const d = new Date(ls.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  }), [lostSales, selectedMonth, selectedYear]);

  // Most sold product
  const productCount: Record<string, number> = {};
  monthlySales.forEach(s => { productCount[s.productId] = (productCount[s.productId] || 0) + 1; });
  const topProductId = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topProduct = topProductId ? getProductName(topProductId) : '—';

  // Financial balance
  const monthlyFinance = useMemo(() => finance.filter(f => {
    const d = new Date(f.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  }), [finance, selectedMonth, selectedYear]);

  const entradas = monthlyFinance.filter(f => f.type === 'entrada').reduce((s, f) => s + f.value, 0);
  const saidas = monthlyFinance.filter(f => f.type === 'saida').reduce((s, f) => s + f.value, 0);
  const saldo = entradas - saidas;

  // Urgent production orders
  const urgentOrders = useMemo(() => production.filter(o => {
    if (o.status === 'entregue' || !o.deadline) return false;
    return getDaysUntil(o.deadline) <= 3;
  }).sort((a, b) => getDaysUntil(a.deadline) - getDaysUntil(b.deadline)), [production]);

  // Lost reasons breakdown (from lostSales)
  const lostByReason = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyLost.forEach(ls => { map[ls.reason] = (map[ls.reason] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthlyLost]);

  // Lead loss reasons breakdown (from leads with status 'perdido')
  const LOSS_COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#6b7280'];
  const leadLossReasonData = useMemo(() => {
    const lostLeads = leads.filter(l => l.status === 'perdido' && l.lossReason);
    const map: Record<string, number> = {};
    lostLeads.forEach(l => { if (l.lossReason) map[l.lossReason] = (map[l.lossReason] || 0) + 1; });
    return Object.entries(map).map(([key, value]) => ({
      name: LEAD_LOSS_REASON_LABELS[key as keyof typeof LEAD_LOSS_REASON_LABELS] || key,
      value,
    })).sort((a, b) => b.value - a.value);
  }, [leads]);

  // Top products breakdown
  const topProducts = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const totalCancellations = cancellations.length;
  const totalReembolsoValue = cancellations.filter(c => c.reembolso === 'sim').reduce((s, c) => s + c.closingValue, 0);
  const totalClients = leads.length;

  const cards = [
    { title: "Total Clientes", value: totalClients, icon: ShoppingBag, color: "text-primary" },
    { title: "Vendas", value: totalSalesCount, icon: DollarSign, color: "text-success" },
    { title: "Faturamento", value: `R$ ${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: "text-success" },
    { title: "Cancelamentos", value: totalCancellations, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Resumo mensal</p>
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

      {/* Urgent alerts */}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Financial summary */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Saldo Financeiro</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="text-base font-bold text-success">R$ {entradas.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saídas</p>
                <p className="text-base font-bold text-destructive">R$ {saidas.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`text-base font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {saldo.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top product */}
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
      </div>

      {/* Loss Reason Charts */}
      {leadLossReasonData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">🥧 Motivos de Perda (Pizza)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={leadLossReasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {leadLossReasonData.map((_, i) => (
                      <Cell key={i} fill={LOSS_COLORS[i % LOSS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">📊 Motivos de Perda (Barras)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={leadLossReasonData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Leads perdidos" radius={[0, 4, 4, 0]}>
                    {leadLossReasonData.map((_, i) => (
                      <Cell key={i} fill={LOSS_COLORS[i % LOSS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">📋 Relatório Mensal — {MONTHS[selectedMonth]} {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Vendas</h4>
                <p className="text-sm">{totalSalesCount} venda(s) realizadas</p>
                <p className="text-sm">Faturamento: <span className="font-semibold text-success">R$ {totalRevenue.toFixed(2)}</span></p>
                <p className="text-sm">Lucro: <span className="font-semibold text-success">R$ {totalProfit.toFixed(2)}</span></p>
                {totalRevenue > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Margem: {((totalProfit / totalRevenue) * 100).toFixed(1)}%</p>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Cancelamentos & Reembolsos</h4>
                <p className="text-sm">{totalCancellations} cancelamento(s)</p>
                <p className="text-sm">Valor reembolsos: <span className="font-semibold text-destructive">R$ {totalReembolsoValue.toFixed(2)}</span></p>
                <p className="text-sm mt-2">{monthlyLost.length} venda(s) perdida(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Saldo Financeiro</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="text-base font-bold text-success">R$ {entradas.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saídas</p>
                <p className="text-base font-bold text-destructive">R$ {saidas.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`text-base font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {saldo.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
