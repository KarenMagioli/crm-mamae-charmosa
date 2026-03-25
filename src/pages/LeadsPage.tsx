import { useState } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { Lead, LeadStatus, LeadOrigin, LeadLossReason, LEAD_STATUS_LABELS, ORIGIN_LABELS, LEAD_LOSS_REASON_LABELS } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, List, Columns3 } from "lucide-react";
import { toast } from "sonner";

const emptyLead = { name: '', phone: '', origin: 'instagram' as LeadOrigin, productInterest: '', status: 'novo' as LeadStatus, notes: '', lossReason: undefined as LeadLossReason | undefined, lossReasonDetail: '' };

const statusColor: Record<LeadStatus, string> = {
  novo: 'bg-blue-50 text-blue-700 border-blue-200',
  em_atendimento: 'bg-amber-50 text-amber-700 border-amber-200',
  orcamento_enviado: 'bg-orange-50 text-orange-700 border-orange-200',
  aguardando_resposta: 'bg-purple-50 text-purple-700 border-purple-200',
  fechado_ganho: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  perdido: 'bg-red-50 text-red-700 border-red-200',
};

const kanbanColumnColor: Record<LeadStatus, string> = {
  novo: 'border-t-blue-400',
  em_atendimento: 'border-t-amber-400',
  orcamento_enviado: 'border-t-orange-400',
  aguardando_resposta: 'border-t-purple-400',
  fechado_ganho: 'border-t-emerald-400',
  perdido: 'border-t-red-400',
};

const LEAD_STATUSES: LeadStatus[] = ['novo', 'em_atendimento', 'orcamento_enviado', 'aguardando_resposta', 'fechado_ganho', 'perdido'];

function LeadCard({ lead, onEdit, onDelete }: { lead: Lead; onEdit: (l: Lead) => void; onDelete: (id: string) => void }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{lead.name}</p>
            <p className="text-xs text-muted-foreground truncate">{lead.phone}</p>
            {lead.productInterest && (
              <p className="text-xs mt-1 text-muted-foreground">🎁 {lead.productInterest}</p>
            )}
            <Badge variant="outline" className={`mt-1.5 text-[10px] px-1.5 py-0 ${statusColor[lead.status]}`}>
              {ORIGIN_LABELS[lead.origin]}
            </Badge>
            {lead.status === 'perdido' && lead.lossReason && (
              <p className="text-[10px] mt-1 text-destructive font-medium">
                ❌ {LEAD_LOSS_REASON_LABELS[lead.lossReason]}
                {lead.lossReason === 'outro' && lead.lossReasonDetail ? `: ${lead.lossReasonDetail}` : ''}
              </p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(lead)}><Pencil className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(lead.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        </div>
        {lead.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">"{lead.notes}"</p>}
      </CardContent>
    </Card>
  );
}

export default function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead } = useCrm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyLead);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOrigin, setFilterOrigin] = useState<string>('all');
  const [filterLossReason, setFilterLossReason] = useState<string>('all');
  const [search, setSearch] = useState('');

  const openNew = () => { setEditing(null); setForm(emptyLead); setOpen(true); };
  const openEdit = (lead: Lead) => { setEditing(lead); setForm({ ...lead, lossReason: lead.lossReason, lossReasonDetail: lead.lossReasonDetail || '' }); setOpen(true); };

  const save = () => {
    if (!form.name || !form.phone) { toast.error('Preencha nome e telefone'); return; }
    if (form.status === 'perdido') {
      if (!form.lossReason) { toast.error('Selecione o motivo da perda'); return; }
      if (form.lossReason === 'outro' && !form.lossReasonDetail?.trim()) { toast.error('Detalhe o motivo da perda'); return; }
    }

    const leadData = {
      ...form,
      lossReason: form.status === 'perdido' ? form.lossReason : undefined,
      lossReasonDetail: form.status === 'perdido' && form.lossReason === 'outro' ? form.lossReasonDetail : undefined,
    };

    if (editing) {
      updateLead({ ...editing, ...leadData });
      toast.success('Cliente atualizado!');
    } else {
      addLead(leadData);
      toast.success('Cliente cadastrado!');
    }
    setOpen(false);
  };

  const remove = (id: string) => { deleteLead(id); toast.success('Cliente removido!'); };

  const moveStatus = (lead: Lead, newStatus: LeadStatus) => {
    if (newStatus === 'perdido') {
      openEdit({ ...lead, status: newStatus });
      return;
    }
    updateLead({ ...lead, status: newStatus, lossReason: undefined, lossReasonDetail: undefined });
  };

  const filtered = leads.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (filterOrigin !== 'all' && l.origin !== filterOrigin) return false;
    if (filterLossReason !== 'all' && l.lossReason !== filterLossReason) return false;
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.phone.includes(search)) return false;
    return true;
  });

  // Loss reason stats
  const lostLeads = leads.filter(l => l.status === 'perdido');
  const lossReasonCounts = Object.entries(LEAD_LOSS_REASON_LABELS).map(([key, label]) => ({
    key, label, count: lostLeads.filter(l => l.lossReason === key).length,
  })).filter(r => r.count > 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes / Leads</h1>
          <p className="text-sm text-muted-foreground">{leads.length} cadastrado(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'kanban' ? 'default' : 'outline'} size="sm" onClick={() => setView('kanban')}>
            <Columns3 className="h-4 w-4 mr-1" /> Funil
          </Button>
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')}>
            <List className="h-4 w-4 mr-1" /> Lista
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v as LeadStatus, lossReason: v !== 'perdido' ? undefined : form.lossReason})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(LEAD_STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Motivo da Perda - only when status is 'perdido' */}
                {form.status === 'perdido' && (
                  <div className="space-y-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div>
                      <Label className="text-destructive font-semibold">Motivo da Perda *</Label>
                      <Select value={form.lossReason || ''} onValueChange={v => setForm({...form, lossReason: v as LeadLossReason, lossReasonDetail: v !== 'outro' ? '' : form.lossReasonDetail})}>
                        <SelectTrigger><SelectValue placeholder="Selecione o motivo..." /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(LEAD_LOSS_REASON_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {form.lossReason === 'outro' && (
                      <div>
                        <Label className="text-destructive font-semibold">Detalhamento do motivo *</Label>
                        <Textarea value={form.lossReasonDetail} onChange={e => setForm({...form, lossReasonDetail: e.target.value})} rows={2} placeholder="Descreva o motivo..." />
                      </div>
                    )}
                  </div>
                )}

                <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} /></div>
                <Button onClick={save} className="w-full">{editing ? 'Salvar' : 'Cadastrar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(LEAD_STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Origens</SelectItem>
            {Object.entries(ORIGIN_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLossReason} onValueChange={setFilterLossReason}>
          <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Motivo Perda" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Motivos</SelectItem>
            {Object.entries(LEAD_LOSS_REASON_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Loss reason summary */}
      {lossReasonCounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">Perdas:</span>
          {lossReasonCounts.map(r => (
            <Badge key={r.key} variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
              {r.label}: {r.count}
            </Badge>
          ))}
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6">
          <div className="flex gap-3 min-w-[900px]">
            {LEAD_STATUSES.map(status => {
              const columnLeads = filtered.filter(l => l.status === status);
              return (
                <div key={status} className={`flex-1 min-w-[160px] bg-card rounded-xl border border-t-4 ${kanbanColumnColor[status]} shadow-sm`}>
                  <div className="p-3 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{LEAD_STATUS_LABELS[status]}</h3>
                      <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center">{columnLeads.length}</Badge>
                    </div>
                  </div>
                  <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
                    {columnLeads.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6 italic">Vazio</p>
                    )}
                    {columnLeads.map(lead => (
                      <div key={lead.id}>
                        <LeadCard lead={lead} onEdit={openEdit} onDelete={remove} />
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {LEAD_STATUSES.filter(s => s !== status).slice(0, 3).map(s => (
                            <button
                              key={s}
                              onClick={() => moveStatus(lead, s)}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-muted hover:bg-accent text-muted-foreground transition-colors"
                            >
                              → {LEAD_STATUS_LABELS[s].split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map(lead => (
              <Card key={lead.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{lead.name}</span>
                      <Badge variant="outline" className={statusColor[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{lead.phone} · {ORIGIN_LABELS[lead.origin]}</p>
                    {lead.productInterest && <p className="text-sm">Interesse: {lead.productInterest}</p>}
                    {lead.status === 'perdido' && lead.lossReason && (
                      <p className="text-sm text-destructive mt-1">
                        Motivo da perda: <strong>{LEAD_LOSS_REASON_LABELS[lead.lossReason]}</strong>
                        {lead.lossReason === 'outro' && lead.lossReasonDetail ? ` — ${lead.lossReasonDetail}` : ''}
                      </p>
                    )}
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
        )
      )}
    </div>
  );
}
