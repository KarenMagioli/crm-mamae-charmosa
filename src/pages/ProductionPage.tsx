import { useState, useMemo } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { ProductionOrder, ProductionStatus, PRODUCTION_STATUS_LABELS } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Pencil, Trash2, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";

const statusColor: Record<ProductionStatus, string> = {
  em_producao: 'bg-amber-50 text-amber-700 border-amber-200',
  pronto: 'bg-blue-50 text-blue-700 border-blue-200',
  entregue: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function getDaysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ProductionPage() {
  const { production, leads, products, addProductionOrder, updateProductionOrder, deleteProductionOrder, getLeadName, getProductName } = useCrm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionOrder | null>(null);
  const [form, setForm] = useState({ leadId: '', productId: '', deadline: '', status: 'em_producao' as ProductionStatus });
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const openNew = () => { setEditing(null); setForm({ leadId: '', productId: '', deadline: '', status: 'em_producao' }); setOpen(true); };
  const openEdit = (o: ProductionOrder) => { setEditing(o); setForm(o); setOpen(true); };

  const save = () => {
    if (!form.leadId || !form.productId) { toast.error('Preencha cliente e produto'); return; }
    if (editing) {
      updateProductionOrder({ ...editing, ...form });
      toast.success('Pedido atualizado!');
    } else {
      addProductionOrder(form);
      toast.success('Pedido criado!');
    }
    setOpen(false);
  };

  const filtered = useMemo(() => {
    return production.filter(o => {
      if (filterStatus !== 'all' && o.status !== filterStatus) return false;
      return true;
    });
  }, [production, filterStatus]);

  // Deadline alerts: orders not delivered, deadline within 3 days or overdue
  const urgentOrders = useMemo(() => {
    return production.filter(o => {
      if (o.status === 'entregue' || !o.deadline) return false;
      const days = getDaysUntil(o.deadline);
      return days <= 3;
    }).sort((a, b) => getDaysUntil(a.deadline) - getDaysUntil(b.deadline));
  }, [production]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Produção</h1>
          <p className="text-sm text-muted-foreground">{production.filter(p => p.status !== 'entregue').length} em andamento</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Pedido</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? 'Editar Pedido' : 'Novo Pedido'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Cliente *</Label>
                <Select value={form.leadId} onValueChange={v => setForm({...form, leadId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Produto *</Label>
                <Select value={form.productId} onValueChange={v => setForm({...form, productId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Prazo</Label><Input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v as ProductionStatus})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PRODUCTION_STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={save} className="w-full">{editing ? 'Salvar' : 'Criar Pedido'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Deadline Alerts */}
      {urgentOrders.length > 0 && (
        <Alert variant="destructive" className="border-orange-300 bg-orange-50 text-orange-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">⚠️ Prazos Próximos!</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-1">
              {urgentOrders.map(o => {
                const days = getDaysUntil(o.deadline);
                const label = days < 0 ? `ATRASADO ${Math.abs(days)} dia(s)` : days === 0 ? 'VENCE HOJE' : `${days} dia(s) restante(s)`;
                return (
                  <li key={o.id} className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="font-medium">{getLeadName(o.leadId)}</span> — {getProductName(o.productId)} —
                    <span className={days < 0 ? 'font-bold' : 'font-medium'}>{label}</span>
                  </li>
                );
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(PRODUCTION_STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum pedido de produção encontrado.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(order => {
            const days = order.deadline ? getDaysUntil(order.deadline) : null;
            const isUrgent = days !== null && days <= 3 && order.status !== 'entregue';
            return (
              <Card key={order.id} className={`shadow-sm hover:shadow-md transition-shadow ${isUrgent ? 'ring-2 ring-orange-300' : ''}`}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{getLeadName(order.leadId)}</span>
                      <Badge variant="outline" className={statusColor[order.status]}>{PRODUCTION_STATUS_LABELS[order.status]}</Badge>
                      {isUrgent && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-[10px]">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          {days! < 0 ? 'Atrasado' : days === 0 ? 'Hoje' : `${days}d`}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{getProductName(order.productId)}</p>
                    {order.deadline && <p className="text-sm">Prazo: {new Date(order.deadline).toLocaleDateString('pt-BR')}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEdit(order)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="outline" size="sm" onClick={() => { deleteProductionOrder(order.id); toast.success('Removido!'); }}><Trash2 className="h-3 w-3" /></Button>
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
