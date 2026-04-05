import { useState, useRef, useMemo } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { Lead, LeadStatus, LeadOrigin, LeadLossReason, ReembolsoOption, LEAD_STATUS_LABELS, ORIGIN_LABELS, LEAD_LOSS_REASON_LABELS, REEMBOLSO_LABELS } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, List, Columns3, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const emptyLead = {
  name: '', phone: '', origin: 'instagram' as LeadOrigin, productInterest: '',
  status: 'lead_instagram' as LeadStatus, notes: '', orderDate: '', closingValue: 0,
  closer: '', cancellationReason: '', reembolso: 'nao' as ReembolsoOption,
  lossReason: undefined as LeadLossReason | undefined, lossReasonDetail: '',
};

const statusColor: Record<LeadStatus, string> = {
  lead_instagram: 'bg-pink-50 text-pink-700 border-pink-200',
  primeiro_contato: 'bg-blue-50 text-blue-700 border-blue-200',
  orcamento_enviado: 'bg-orange-50 text-orange-700 border-orange-200',
  negociacao: 'bg-purple-50 text-purple-700 border-purple-200',
  pedido_cancelamento: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelado: 'bg-red-50 text-red-700 border-red-200',
};

const kanbanColumnColor: Record<LeadStatus, string> = {
  lead_instagram: 'border-t-pink-400',
  primeiro_contato: 'border-t-blue-400',
  orcamento_enviado: 'border-t-orange-400',
  negociacao: 'border-t-purple-400',
  pedido_cancelamento: 'border-t-amber-400',
  cancelado: 'border-t-red-400',
};

const LEAD_STATUSES: LeadStatus[] = ['lead_instagram', 'primeiro_contato', 'orcamento_enviado', 'negociacao', 'pedido_cancelamento', 'cancelado'];

function LeadCard({ lead, onEdit, onDelete }: { lead: Lead; onEdit: (l: Lead) => void; onDelete: (id: string) => void }) {
  const isCancelOrLost = lead.status === 'pedido_cancelamento' || lead.status === 'cancelado';
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{lead.name}</p>
            <p className="text-xs text-muted-foreground truncate">{lead.phone}</p>
            {lead.productInterest && <p className="text-xs mt-1 text-muted-foreground">🎁 {lead.productInterest}</p>}
            {lead.closingValue != null && lead.closingValue > 0 && (
              <p className="text-xs mt-0.5 font-medium">R$ {lead.closingValue.toFixed(2)}</p>
            )}
            {lead.closer && <p className="text-[10px] text-muted-foreground">Closer: {lead.closer}</p>}
            <Badge variant="outline" className={`mt-1.5 text-[10px] px-1.5 py-0 ${statusColor[lead.status]}`}>
              {ORIGIN_LABELS[lead.origin]}
            </Badge>
            {isCancelOrLost && lead.cancellationReason && (
              <p className="text-[10px] mt-1 text-destructive font-medium">❌ {lead.cancellationReason}</p>
            )}
            {lead.reembolso === 'sim' && (
              <Badge variant="outline" className="mt-1 text-[10px] bg-amber-50 text-amber-700 border-amber-200">Reembolso</Badge>
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
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openNew = () => { setEditing(null); setForm({ ...emptyLead }); setOpen(true); };
  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setForm({
      name: lead.name, phone: lead.phone, origin: lead.origin,
      productInterest: lead.productInterest, status: lead.status, notes: lead.notes,
      orderDate: lead.orderDate || '', closingValue: lead.closingValue || 0,
      closer: lead.closer || '', cancellationReason: lead.cancellationReason || '',
      reembolso: lead.reembolso || 'nao',
      lossReason: lead.lossReason, lossReasonDetail: lead.lossReasonDetail || '',
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name || !form.phone) { toast.error('Preencha nome e telefone'); return; }
    if (form.status === 'cancelado' && !form.cancellationReason?.trim()) {
      toast.error('Informe o motivo do cancelamento'); return;
    }

    const leadData = {
      name: form.name, phone: form.phone, origin: form.origin,
      productInterest: form.productInterest, status: form.status, notes: form.notes,
      orderDate: form.orderDate || undefined, closingValue: form.closingValue || undefined,
      closer: form.closer || undefined, cancellationReason: form.cancellationReason || undefined,
      reembolso: form.reembolso,
      lossReason: form.status === 'cancelado' ? form.lossReason : undefined,
      lossReasonDetail: form.status === 'cancelado' && form.lossReason === 'outro' ? form.lossReasonDetail : undefined,
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
    if (newStatus === 'cancelado') {
      openEdit({ ...lead, status: newStatus });
      return;
    }
    updateLead({ ...lead, status: newStatus });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

        const parseDate = (val: any): string => {
          if (!val) return '';
          if (typeof val === 'number') {
            const d = XLSX.SSF.parse_date_code(val);
            return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
          }
          const parsed = new Date(val);
          return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
        };

        const mapStatus = (val: string): LeadStatus => {
          const v = (val || '').toLowerCase().trim();
          if (v.includes('cancelado') || v.includes('perdid')) return 'cancelado';
          if (v.includes('pedido') || v.includes('cancelamento')) return 'pedido_cancelamento';
          if (v.includes('negocia')) return 'negociacao';
          if (v.includes('orcamento') || v.includes('orçamento')) return 'orcamento_enviado';
          if (v.includes('contato')) return 'primeiro_contato';
          return 'lead_instagram';
        };

        let imported = 0;
        rows.forEach((row) => {
          const reembolsoVal = String(row['Reembolso'] || row['reembolso'] || '').toLowerCase().trim();
          addLead({
            name: String(row['Cliente'] || row['client'] || row['Nome'] || ''),
            phone: String(row['Telefone'] || row['phone'] || ''),
            origin: 'outro' as LeadOrigin,
            productInterest: String(row['Produto'] || row['product'] || ''),
            status: mapStatus(String(row['Status'] || row['status'] || '')),
            notes: String(row['OBS'] || row['obs'] || row['Obs'] || ''),
            orderDate: parseDate(row['Data do pedido'] || row['orderDate']),
            closingValue: Number(row['Valor fechamento'] || row['closingValue'] || 0),
            closer: String(row['Closer'] || row['closer'] || ''),
            cancellationReason: String(row['Motivo'] || row['reason'] || ''),
            reembolso: reembolsoVal === 'sim' ? 'sim' : 'nao',
          });
          imported++;
        });
        toast.success(`${imported} cliente(s) importado(s) com sucesso!`);
      } catch {
        toast.error('Erro ao importar planilha. Verifique o formato.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filtered = leads.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (filterOrigin !== 'all' && l.origin !== filterOrigin) return false;
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.phone.includes(search)) return false;
    return true;
  });

  const stats = useMemo(() => {
    const total = leads.length;
    const pedidosCancelamento = leads.filter(l => l.status === 'pedido_cancelamento').length;
    const cancelados = leads.filter(l => l.status === 'cancelado').length;
    const totalValue = leads.filter(l => l.status !== 'cancelado' && l.status !== 'pedido_cancelamento').reduce((s, l) => s + (l.closingValue || 0), 0);
    const lostValue = leads.filter(l => l.status === 'cancelado').reduce((s, l) => s + (l.closingValue || 0), 0);
    return { total, pedidosCancelamento, cancelados, totalValue, lostValue };
  }, [leads]);

  const isCancelStatus = form.status === 'pedido_cancelamento' || form.status === 'cancelado';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Funil de Clientes</h1>
          <p className="text-sm text-muted-foreground">{leads.length} cadastrado(s)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={view === 'kanban' ? 'default' : 'outline'} size="sm" onClick={() => setView('kanban')}>
            <Columns3 className="h-4 w-4 mr-1" /> Funil
          </Button>
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')}>
            <List className="h-4 w-4 mr-1" /> Lista
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Importar Clientes
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Cliente *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Telefone / WhatsApp *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Origem</Label>
                  <Select value={form.origin} onValueChange={v => setForm({ ...form, origin: v as LeadOrigin })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(ORIGIN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Produto</Label><Input value={form.productInterest} onChange={e => setForm({ ...form, productInterest: e.target.value })} /></div>
                <div><Label>Data do Pedido</Label><Input type="date" value={form.orderDate} onChange={e => setForm({ ...form, orderDate: e.target.value })} /></div>
                <div><Label>Valor Fechamento (R$)</Label><Input type="number" min="0" step="0.01" value={form.closingValue || ''} onChange={e => setForm({ ...form, closingValue: Number(e.target.value) })} /></div>
                <div><Label>Closer</Label><Input value={form.closer} onChange={e => setForm({ ...form, closer: e.target.value })} /></div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as LeadStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {isCancelStatus && (
                  <div className="space-y-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div><Label className="text-destructive font-semibold">Motivo de Cancelamento {form.status === 'cancelado' ? '*' : ''}</Label>
                      <Textarea value={form.cancellationReason} onChange={e => setForm({ ...form, cancellationReason: e.target.value })} rows={2} placeholder="Descreva o motivo..." />
                    </div>
                    <div><Label>Reembolso</Label>
                      <Select value={form.reembolso} onValueChange={v => setForm({ ...form, reembolso: v as ReembolsoOption })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(REEMBOLSO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
                <Button onClick={save} className="w-full">{editing ? 'Salvar' : 'Cadastrar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="shadow-sm"><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total no Funil</p>
          <p className="text-lg font-bold">{stats.total}</p>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Ped. Cancelamento</p>
          <p className="text-lg font-bold text-amber-600">{stats.pedidosCancelamento}</p>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Cancelados</p>
          <p className="text-lg font-bold text-destructive">{stats.cancelados}</p>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Valor Vendas</p>
          <p className="text-lg font-bold text-emerald-600">R$ {stats.totalValue.toFixed(2)}</p>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Valor Perdido</p>
          <p className="text-lg font-bold text-destructive">R$ {stats.lostValue.toFixed(2)}</p>
        </CardContent></Card>
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
            {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Origens</SelectItem>
            {Object.entries(ORIGIN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div className="overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6">
          <div className="flex gap-3 min-w-[1100px]">
            {LEAD_STATUSES.map(status => {
              const columnLeads = filtered.filter(l => l.status === status);
              return (
                <div key={status} className={`flex-1 min-w-[170px] bg-card rounded-xl border border-t-4 ${kanbanColumnColor[status]} shadow-sm`}>
                  <div className="p-3 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{LEAD_STATUS_LABELS[status]}</h3>
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
                          {LEAD_STATUSES.filter(s => s !== status).map(s => (
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

      {/* List */}
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
                      {lead.reembolso === 'sim' && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Reembolso</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{lead.phone} · {ORIGIN_LABELS[lead.origin]}</p>
                    {lead.productInterest && <p className="text-sm">Produto: {lead.productInterest}</p>}
                    {lead.closingValue != null && lead.closingValue > 0 && <p className="text-sm">Valor: <strong>R$ {lead.closingValue.toFixed(2)}</strong></p>}
                    {lead.closer && <p className="text-sm text-muted-foreground">Closer: {lead.closer}</p>}
                    {lead.cancellationReason && <p className="text-sm text-destructive">Motivo: {lead.cancellationReason}</p>}
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
