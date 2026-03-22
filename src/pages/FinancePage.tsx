import { useState } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { FinanceType, FinanceCategory } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<FinanceCategory, string> = {
  venda: 'Venda', custo_material: 'Custo de Material', outros: 'Outros',
};

export default function FinancePage() {
  const { finance, addFinanceEntry, deleteFinanceEntry } = useCrm();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'entrada' as FinanceType, category: 'venda' as FinanceCategory, description: '', value: 0, date: new Date().toISOString().split('T')[0] });

  const save = () => {
    if (!form.description || form.value <= 0) { toast.error('Preencha descrição e valor'); return; }
    addFinanceEntry(form);
    toast.success('Lançamento registrado!');
    setOpen(false);
    setForm({ type: 'entrada', category: 'venda', description: '', value: 0, date: new Date().toISOString().split('T')[0] });
  };

  const entradas = finance.filter(f => f.type === 'entrada').reduce((s, f) => s + f.value, 0);
  const saidas = finance.filter(f => f.type === 'saida').reduce((s, f) => s + f.value, 0);
  const saldo = entradas - saidas;

  const sorted = [...finance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo Lançamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v as FinanceType})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v as FinanceCategory})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Descrição *</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div><Label>Valor (R$) *</Label><Input type="number" value={form.value} onChange={e => setForm({...form, value: Number(e.target.value)})} /></div>
              <div><Label>Data</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
              <Button onClick={save} className="w-full">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Entradas</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-success">R$ {entradas.toFixed(2)}</p></CardContent></Card>
        <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Saídas</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-destructive">R$ {saidas.toFixed(2)}</p></CardContent></Card>
        <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Saldo</CardTitle></CardHeader><CardContent><p className={`text-xl font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {saldo.toFixed(2)}</p></CardContent></Card>
      </div>

      {sorted.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum lançamento financeiro.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {sorted.map(f => (
            <Card key={f.id} className="shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                {f.type === 'entrada' ? <ArrowUpCircle className="h-5 w-5 text-success shrink-0" /> : <ArrowDownCircle className="h-5 w-5 text-destructive shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{f.description}</p>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[f.category]} · {new Date(f.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className={`font-semibold ${f.type === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                  {f.type === 'entrada' ? '+' : '-'}R$ {f.value.toFixed(2)}
                </span>
                <Button variant="ghost" size="sm" onClick={() => { deleteFinanceEntry(f.id); toast.success('Removido!'); }}><Trash2 className="h-3 w-3" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
