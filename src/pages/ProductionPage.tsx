import { useState } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { ProductionOrder, ProductionStatus, PRODUCTION_STATUS_LABELS } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusColor: Record<ProductionStatus, string> = {
  em_producao: 'bg-yellow-100 text-yellow-800',
  pronto: 'bg-blue-100 text-blue-800',
  entregue: 'bg-green-100 text-green-800',
};

export default function ProductionPage() {
  const { production, leads, products, addProductionOrder, updateProductionOrder, deleteProductionOrder, getLeadName, getProductName } = useCrm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionOrder | null>(null);
  const [form, setForm] = useState({ leadId: '', productId: '', deadline: '', status: 'em_producao' as ProductionStatus });

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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
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

      {production.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum pedido de produção.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {production.map(order => (
            <Card key={order.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{getLeadName(order.leadId)}</span>
                    <Badge variant="outline" className={statusColor[order.status]}>{PRODUCTION_STATUS_LABELS[order.status]}</Badge>
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
          ))}
        </div>
      )}
    </div>
  );
}
