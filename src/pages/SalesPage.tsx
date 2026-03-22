import { useState, useMemo } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { Sale, SaleStatus, PaymentMethod, PAYMENT_LABELS, SALE_STATUS_LABELS } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const emptySale = { leadId: '', productId: '', value: 0, date: new Date().toISOString().split('T')[0], paymentMethod: 'pix' as PaymentMethod, status: 'pendente' as SaleStatus };

const statusColor: Record<SaleStatus, string> = {
  pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  pago: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelado: 'bg-red-50 text-red-700 border-red-200',
};

export default function SalesPage() {
  const { sales, leads, products, addSale, updateSale, deleteSale, addFinanceEntry, getLeadName, getProductName } = useCrm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [form, setForm] = useState(emptySale);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const openNew = () => { setEditing(null); setForm({...emptySale, date: new Date().toISOString().split('T')[0]}); setOpen(true); };
  const openEdit = (s: Sale) => { setEditing(s); setForm(s); setOpen(true); };

  const save = () => {
    if (!form.leadId || !form.productId || form.value <= 0) { toast.error('Preencha todos os campos'); return; }
    if (editing) {
      updateSale({ ...editing, ...form });
      toast.success('Venda atualizada!');
    } else {
      addSale(form);
      addFinanceEntry({ type: 'entrada', category: 'venda', description: `Venda - ${getLeadName(form.leadId)}`, value: form.value, date: form.date });
      toast.success('Venda registrada!');
    }
    setOpen(false);
  };

  const getProductCost = (productId: string) => products.find(p => p.id === productId)?.cost || 0;

  const filtered = useMemo(() => {
    return sales.filter(s => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterProduct !== 'all' && s.productId !== filterProduct) return false;
      if (filterDateFrom && s.date < filterDateFrom) return false;
      if (filterDateTo && s.date > filterDateTo) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, filterStatus, filterProduct, filterDateFrom, filterDateTo]);

  const totalFiltered = filtered.reduce((s, v) => s + v.value, 0);
  const totalProfit = filtered.reduce((s, v) => s + (v.value - getProductCost(v.productId)), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vendas</h1>
          <p className="text-sm text-muted-foreground">{sales.length} venda(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nova Venda</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? 'Editar Venda' : 'Nova Venda'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Cliente *</Label>
                <Select value={form.leadId} onValueChange={v => setForm({...form, leadId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Produto *</Label>
                <Select value={form.productId} onValueChange={v => {
                  const p = products.find(x => x.id === v);
                  setForm({...form, productId: v, value: p?.price || form.value});
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valor (R$) *</Label><Input type="number" value={form.value} onChange={e => setForm({...form, value: Number(e.target.value)})} /></div>
              <div><Label>Data</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
              <div><Label>Pagamento</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm({...form, paymentMethod: v as PaymentMethod})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PAYMENT_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v as SaleStatus})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SALE_STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={save} className="w-full">{editing ? 'Salvar' : 'Registrar Venda'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(SALE_STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Produto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Produtos</SelectItem>
            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2 items-center">
          <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="h-9 w-[140px]" placeholder="De" />
          <span className="text-muted-foreground text-sm">até</span>
          <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="h-9 w-[140px]" placeholder="Até" />
        </div>
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="flex gap-4 flex-wrap text-sm">
          <span className="font-medium">Faturamento: <span className="text-success">R$ {totalFiltered.toFixed(2)}</span></span>
          <span className="font-medium flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            Lucro: <span className="text-success">R$ {totalProfit.toFixed(2)}</span>
          </span>
          <span className="text-muted-foreground">{filtered.length} venda(s)</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma venda encontrada.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(sale => {
            const cost = getProductCost(sale.productId);
            const profit = sale.value - cost;
            return (
              <Card key={sale.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{getLeadName(sale.leadId)}</span>
                      <Badge variant="outline" className={statusColor[sale.status]}>{SALE_STATUS_LABELS[sale.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{getProductName(sale.productId)} · {PAYMENT_LABELS[sale.paymentMethod]}</p>
                    <div className="flex gap-3 mt-1 text-sm">
                      <span className="font-medium">R$ {sale.value.toFixed(2)}</span>
                      <span className={`flex items-center gap-1 ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        <TrendingUp className="h-3 w-3" />
                        Lucro: R$ {profit.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">{new Date(sale.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEdit(sale)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="outline" size="sm" onClick={() => { deleteSale(sale.id); toast.success('Removida!'); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
