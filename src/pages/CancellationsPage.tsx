import { useState, useRef } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { CancellationRequest, CancellationStatus, ReembolsoOption, CANCELLATION_STATUS_LABELS, REEMBOLSO_LABELS } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const emptyForm = {
  requestDate: new Date().toISOString().split('T')[0],
  client: '',
  orderDate: '',
  closingValue: 0,
  closer: '',
  product: '',
  reason: '',
  status: 'em_analise' as CancellationStatus,
  reembolso: 'nao' as ReembolsoOption,
  obs: '',
};

const statusColor: Record<CancellationStatus, string> = {
  em_analise: 'bg-amber-50 text-amber-700 border-amber-200',
  aprovado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  negado: 'bg-red-50 text-red-700 border-red-200',
};

export default function CancellationsPage() {
  const { cancellations, addCancellation, updateCancellation, deleteCancellation } = useCrm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CancellationRequest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openNew = () => { setEditing(null); setForm({...emptyForm, requestDate: new Date().toISOString().split('T')[0]}); setOpen(true); };
  const openEdit = (c: CancellationRequest) => { setEditing(c); setForm(c); setOpen(true); };

  const save = () => {
    if (!form.client || !form.reason) { toast.error('Preencha cliente e motivo'); return; }
    if (editing) {
      updateCancellation({ ...editing, ...form });
      toast.success('Cancelamento atualizado!');
    } else {
      addCancellation(form);
      toast.success('Cancelamento registrado!');
    }
    setOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

        let imported = 0;
        rows.forEach((row) => {
          const mapStatus = (val: string): CancellationStatus => {
            const v = (val || '').toLowerCase().trim();
            if (v.includes('aprovado')) return 'aprovado';
            if (v.includes('negado')) return 'negado';
            return 'em_analise';
          };

          const mapReembolso = (val: string): ReembolsoOption => {
            const v = (val || '').toLowerCase().trim();
            return v === 'sim' ? 'sim' : 'nao';
          };

          const parseDate = (val: any): string => {
            if (!val) return new Date().toISOString().split('T')[0];
            if (typeof val === 'number') {
              const d = XLSX.SSF.parse_date_code(val);
              return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
            }
            const parsed = new Date(val);
            return isNaN(parsed.getTime()) ? new Date().toISOString().split('T')[0] : parsed.toISOString().split('T')[0];
          };

          addCancellation({
            requestDate: parseDate(row['Data de solicitação de cancelamento'] || row['Data de solicitacao de cancelamento'] || row['requestDate']),
            client: String(row['Cliente'] || row['client'] || ''),
            orderDate: parseDate(row['Data do pedido'] || row['orderDate']),
            closingValue: Number(row['Valor fechamento'] || row['closingValue'] || 0),
            closer: String(row['Closer'] || row['closer'] || ''),
            product: String(row['Produto'] || row['product'] || ''),
            reason: String(row['Motivo'] || row['reason'] || ''),
            status: mapStatus(String(row['Status'] || row['status'] || '')),
            reembolso: mapReembolso(String(row['Reembolso'] || row['reembolso'] || '')),
            obs: String(row['OBS'] || row['obs'] || row['Obs'] || ''),
          });
          imported++;
        });

        toast.success(`${imported} cancelamento(s) importado(s)!`);
      } catch {
        toast.error('Erro ao importar planilha. Verifique o formato.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filtered = cancellations.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  const totalValue = filtered.reduce((s, c) => s + c.closingValue, 0);
  const totalReembolso = filtered.filter(c => c.reembolso === 'sim').reduce((s, c) => s + c.closingValue, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cancelamentos</h1>
          <p className="text-sm text-muted-foreground">{cancellations.length} solicitação(ões)</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Importar Cancelamentos
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? 'Editar Cancelamento' : 'Nova Solicitação'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Data de Solicitação *</Label><Input type="date" value={form.requestDate} onChange={e => setForm({...form, requestDate: e.target.value})} /></div>
                <div><Label>Cliente *</Label><Input value={form.client} onChange={e => setForm({...form, client: e.target.value})} /></div>
                <div><Label>Data do Pedido</Label><Input type="date" value={form.orderDate} onChange={e => setForm({...form, orderDate: e.target.value})} /></div>
                <div><Label>Valor Fechamento (R$)</Label><Input type="number" min="0" step="0.01" value={form.closingValue || ''} onChange={e => setForm({...form, closingValue: Number(e.target.value)})} /></div>
                <div><Label>Closer</Label><Input value={form.closer} onChange={e => setForm({...form, closer: e.target.value})} /></div>
                <div><Label>Produto</Label><Input value={form.product} onChange={e => setForm({...form, product: e.target.value})} /></div>
                <div><Label>Motivo *</Label><Textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows={2} /></div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v as CancellationStatus})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(CANCELLATION_STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Reembolso</Label>
                  <Select value={form.reembolso} onValueChange={v => setForm({...form, reembolso: v as ReembolsoOption})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(REEMBOLSO_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Observações</Label><Textarea value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} rows={3} /></div>
                <Button onClick={save} className="w-full">{editing ? 'Salvar' : 'Registrar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(CANCELLATION_STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        {filtered.length > 0 && (
          <div className="flex gap-4 text-sm">
            <span>Total: <strong className="text-destructive">R$ {totalValue.toFixed(2)}</strong></span>
            <span>Reembolsos: <strong className="text-destructive">R$ {totalReembolso.toFixed(2)}</strong></span>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cancelamento encontrado.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <Card key={c.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{c.client}</span>
                    <Badge variant="outline" className={statusColor[c.status]}>{CANCELLATION_STATUS_LABELS[c.status]}</Badge>
                    {c.reembolso === 'sim' && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Reembolso</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{c.product} · Closer: {c.closer}</p>
                  <p className="text-sm">Valor: <strong>R$ {c.closingValue.toFixed(2)}</strong></p>
                  <p className="text-sm text-muted-foreground">Motivo: {c.reason}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>Solicitado: {new Date(c.requestDate).toLocaleDateString('pt-BR')}</span>
                    {c.orderDate && <span>Pedido: {new Date(c.orderDate).toLocaleDateString('pt-BR')}</span>}
                  </div>
                  {c.obs && <p className="text-xs text-muted-foreground mt-1 italic">"{c.obs}"</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="outline" size="sm" onClick={() => { deleteCancellation(c.id); toast.success('Removido!'); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
