import { useState } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { Lead, LeadStatus, LeadOrigin, LEAD_STATUS_LABELS, ORIGIN_LABELS } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const emptyLead = { name: '', phone: '', origin: 'instagram' as LeadOrigin, productInterest: '', status: 'novo' as LeadStatus, notes: '' };

const statusColor: Record<LeadStatus, string> = {
  novo: 'bg-blue-100 text-blue-800',
  em_atendimento: 'bg-yellow-100 text-yellow-800',
  orcamento_enviado: 'bg-orange-100 text-orange-800',
  aguardando_resposta: 'bg-purple-100 text-purple-800',
  fechado_ganho: 'bg-green-100 text-green-800',
  perdido: 'bg-red-100 text-red-800',
};

export default function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead } = useCrm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyLead);

  const openNew = () => { setEditing(null); setForm(emptyLead); setOpen(true); };
  const openEdit = (lead: Lead) => { setEditing(lead); setForm(lead); setOpen(true); };

  const save = () => {
    if (!form.name || !form.phone) { toast.error('Preencha nome e telefone'); return; }
    if (editing) {
      updateLead({ ...editing, ...form });
      toast.success('Cliente atualizado!');
    } else {
      addLead(form);
      toast.success('Cliente cadastrado!');
    }
    setOpen(false);
  };

  const remove = (id: string) => { deleteLead(id); toast.success('Cliente removido!'); };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes / Leads</h1>
          <p className="text-sm text-muted-foreground">{leads.length} cadastrado(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>Telefone / WhatsApp *</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              <div><Label>Origem</Label>
                <Select value={form.origin} onValueChange={v => setForm({...form, origin: v as LeadOrigin})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ORIGIN_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Produto de Interesse</Label><Input value={form.productInterest} onChange={e => setForm({...form, productInterest: e.target.value})} /></div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v as LeadStatus})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(LEAD_STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} /></div>
              <Button onClick={save} className="w-full">{editing ? 'Salvar' : 'Cadastrar'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {leads.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cliente cadastrado. Clique em "Adicionar" para começar!</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {leads.map(lead => (
            <Card key={lead.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{lead.name}</span>
                    <Badge variant="outline" className={statusColor[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{lead.phone} · {ORIGIN_LABELS[lead.origin]}</p>
                  {lead.productInterest && <p className="text-sm">Interesse: {lead.productInterest}</p>}
                  {lead.notes && <p className="text-xs text-muted-foreground mt-1">{lead.notes}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(lead)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="outline" size="sm" onClick={() => remove(lead.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
