import { useState } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { LostReason, LOST_REASON_LABELS } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function LostSalesPage() {
  const { lostSales, leads, products, addLostSale, getLeadName, getProductName } = useCrm();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ leadId: '', productId: '', reason: 'desistencia' as LostReason, reasonDetail: '', date: new Date().toISOString().split('T')[0] });

  const save = () => {
    if (!form.leadId || !form.reason) { toast.error('Preencha os campos obrigatórios'); return; }
    addLostSale(form);
    toast.success('Venda perdida registrada');
    setOpen(false);
    setForm({ leadId: '', productId: '', reason: 'desistencia', reasonDetail: '', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendas Perdidas</h1>
          <p className="text-sm text-muted-foreground">{lostSales.length} registro(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Registrar</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Registrar Venda Perdida</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Cliente *</Label>
                <Select value={form.leadId} onValueChange={v => setForm({...form, leadId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Produto</Label>
                <Select value={form.productId} onValueChange={v => setForm({...form, productId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Motivo *</Label>
                <Select value={form.reason} onValueChange={v => setForm({...form, reason: v as LostReason})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(LOST_REASON_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Detalhe</Label><Textarea value={form.reasonDetail} onChange={e => setForm({...form, reasonDetail: e.target.value})} rows={2} /></div>
              <div><Label>Data</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
              <Button onClick={save} className="w-full">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {lostSales.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma venda perdida registrada.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {lostSales.map(ls => (
            <Card key={ls.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{getLeadName(ls.leadId)}</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700">{LOST_REASON_LABELS[ls.reason]}</Badge>
                </div>
                {ls.productId && <p className="text-sm text-muted-foreground">{getProductName(ls.productId)}</p>}
                {ls.reasonDetail && <p className="text-sm mt-1">{ls.reasonDetail}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(ls.date).toLocaleDateString('pt-BR')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
