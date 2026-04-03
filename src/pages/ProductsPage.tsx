import { useState } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { Product } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const emptyProduct = { name: '', cost: 0, price: 0 };

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useCrm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);

  const openNew = () => { setEditing(null); setForm(emptyProduct); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm(p); setOpen(true); };

  const save = () => {
    if (!form.name || form.price <= 0) { toast.error('Preencha nome e preço'); return; }
    if (editing) {
      updateProduct({ ...editing, ...form });
      toast.success('Produto atualizado!');
    } else {
      addProduct(form);
      toast.success('Produto cadastrado!');
    }
    setOpen(false);
  };

  const hasCost = form.cost > 0;
  const hasPrice = form.price > 0;
  const canCalculateProfit = hasCost && hasPrice;
  const profit = canCalculateProfit ? form.price - form.cost : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products.length} produto(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>Custo (R$)</Label><Input type="number" min="0" step="0.01" value={form.cost || ''} onChange={e => setForm({...form, cost: Number(e.target.value)})} /></div>
              <div><Label>Preço de Venda (R$) *</Label><Input type="number" min="0" step="0.01" value={form.price || ''} onChange={e => setForm({...form, price: Number(e.target.value)})} /></div>
              <div className="p-3 rounded-lg bg-accent">
                {canCalculateProfit ? (
                  <p className="text-sm font-medium">Lucro estimado: <span className={profit >= 0 ? 'text-success' : 'text-destructive'}>R$ {profit.toFixed(2)}</span></p>
                ) : (
                  <p className="text-sm text-muted-foreground">Informe o custo e o preço para calcular o lucro</p>
                )}
              </div>
              <Button onClick={save} className="w-full">{editing ? 'Salvar' : 'Cadastrar'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum produto cadastrado.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(p => (
            <Card key={p.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">Custo: R$ {p.cost.toFixed(2)}</p>
                    <p className="text-sm font-medium">Preço: R$ {p.price.toFixed(2)}</p>
                    <p className="text-sm text-success font-medium">Lucro: R$ {(p.price - p.cost).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { deleteProduct(p.id); toast.success('Removido!'); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
