import { useCrm } from "@/contexts/CrmContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, DollarSign, XCircle, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { sales, lostSales, finance, products, getProductName } = useCrm();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlySales = sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && s.status !== 'cancelado';
  });

  const totalSalesCount = monthlySales.length;
  const totalRevenue = monthlySales.reduce((sum, s) => sum + s.value, 0);
  const monthlyLost = lostSales.filter(ls => {
    const d = new Date(ls.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // Most sold product
  const productCount: Record<string, number> = {};
  monthlySales.forEach(s => {
    productCount[s.productId] = (productCount[s.productId] || 0) + 1;
  });
  const topProductId = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topProduct = topProductId ? getProductName(topProductId) : '—';

  // Financial balance
  const monthlyFinance = finance.filter(f => {
    const d = new Date(f.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const entradas = monthlyFinance.filter(f => f.type === 'entrada').reduce((s, f) => s + f.value, 0);
  const saidas = monthlyFinance.filter(f => f.type === 'saida').reduce((s, f) => s + f.value, 0);
  const saldo = entradas - saidas;

  const cards = [
    { title: "Vendas no Mês", value: totalSalesCount, icon: ShoppingBag, color: "text-primary" },
    { title: "Faturamento", value: `R$ ${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-success" },
    { title: "Vendas Perdidas", value: monthlyLost, icon: XCircle, color: "text-destructive" },
    { title: "Produto Mais Vendido", value: topProduct, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Resumo do mês atual</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Saldo Financeiro do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Entradas</p>
              <p className="text-lg font-bold text-success">R$ {entradas.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saídas</p>
              <p className="text-lg font-bold text-destructive">R$ {saidas.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className={`text-lg font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {saldo.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
