"use client";

import React, { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "products"), where("userId", "==", user.uid));
  }, [db, user]);

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    categoryId: "Geral",
    costPrice: "",
    salePrice: "",
    stockQuantity: "",
    minStockQuantity: "",
    description: "",
    unitOfMeasure: "un"
  });

  useEffect(() => {
    if (!isDialogOpen) {
      setEditingProduct(null);
      setFormData({
        name: "",
        sku: "",
        categoryId: "Geral",
        costPrice: "",
        salePrice: "",
        stockQuantity: "",
        minStockQuantity: "",
        description: "",
        unitOfMeasure: "un"
      });
    }
  }, [isDialogOpen]);

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId || "Geral",
      costPrice: product.costPrice?.toString() || "",
      salePrice: product.salePrice?.toString() || "",
      stockQuantity: product.stockQuantity?.toString() || "",
      minStockQuantity: product.minStockQuantity?.toString() || "",
      description: product.description || "",
      unitOfMeasure: product.unitOfMeasure || "un"
    });
    setIsDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!user || !db || !formData.name) return;
    
    const productId = editingProduct ? editingProduct.id : doc(collection(db, "products")).id;
    const productRef = doc(db, "products", productId);
    const now = new Date().toISOString();

    const productData = {
      id: productId,
      userId: user.uid,
      name: formData.name,
      sku: formData.sku,
      categoryId: formData.categoryId,
      costPrice: Number(formData.costPrice || 0),
      salePrice: Number(formData.salePrice || 0),
      stockQuantity: Number(formData.stockQuantity || 0),
      minStockQuantity: Number(formData.minStockQuantity || 0),
      unitOfMeasure: formData.unitOfMeasure,
      description: formData.description,
      isActive: true,
      updatedAt: now,
      createdAt: editingProduct ? editingProduct.createdAt : now,
    };

    setDocumentNonBlocking(productRef, productData, { merge: true });

    const auditRef = doc(collection(db, "audit_logs"));
    setDocumentNonBlocking(auditRef, {
      id: auditRef.id,
      userId: user.uid,
      userName: user.displayName || user.email,
      action: editingProduct ? "Produto Atualizado" : "Produto Cadastrado",
      targetCollection: "products",
      targetId: productId,
      createdAt: now,
    }, { merge: true });

    toast({ title: "Sucesso!", description: editingProduct ? "Produto atualizado." : "Produto cadastrado." });
    setIsDialogOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (!user || !db) return;
    const productRef = doc(db, "products", id);
    deleteDocumentNonBlocking(productRef);

    const auditRef = doc(collection(db, "audit_logs"));
    setDocumentNonBlocking(auditRef, {
      id: auditRef.id,
      userId: user.uid,
      userName: user.displayName || user.email,
      action: "Produto Removido",
      targetCollection: "products",
      targetId: id,
      createdAt: new Date().toISOString(),
    }, { merge: true });

    toast({ title: "Produto removido" });
  };

  const filteredProducts = products?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.includes(searchTerm)
  ) || [];

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">Catálogo de Produtos</h1>
            <p className="text-muted-foreground mt-1">Gerencie seu estoque de forma eficiente.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-lg shadow-primary/20 h-12 px-8 bg-primary font-bold">
                <Plus className="mr-2 h-5 w-5" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] bg-card border-none rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
              <DialogHeader className="p-8 pb-4 bg-muted/30">
                <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-3">
                  <Package className="h-7 w-7 text-primary" />
                  {editingProduct ? "Editar Produto" : "Novo Cadastro"}
                </DialogTitle>
              </DialogHeader>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-50">Nome do Produto *</Label>
                    <Input value={formData.name} className="bg-muted border-none h-12 rounded-2xl" onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Arroz Integral 5kg" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-50">SKU / Barcode</Label>
                    <Input value={formData.sku} className="bg-muted border-none h-12 rounded-2xl" onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="000000" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-50">Categoria</Label>
                    <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v})}>
                      <SelectTrigger className="bg-muted border-none h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alimentos">Alimentos</SelectItem>
                        <SelectItem value="Bebidas">Bebidas</SelectItem>
                        <SelectItem value="Limpeza">Limpeza</SelectItem>
                        <SelectItem value="Higiene">Higiene</SelectItem>
                        <SelectItem value="Geral">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-50">Preço de Custo (R$)</Label>
                    <Input type="number" className="bg-muted border-none h-12 rounded-2xl" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-50">Preço de Venda (R$)</Label>
                    <Input type="number" className="bg-muted border-none h-12 rounded-2xl font-bold text-primary" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-50">Estoque Atual</Label>
                    <Input type="number" className="bg-muted border-none h-12 rounded-2xl" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-50">Estoque Mínimo</Label>
                    <Input type="number" className="bg-muted border-none h-12 rounded-2xl" value={formData.minStockQuantity} onChange={e => setFormData({...formData, minStockQuantity: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest opacity-50">Descrição do Produto</Label>
                  <Textarea className="bg-muted border-none min-h-[120px] rounded-2xl resize-none p-4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Informações detalhadas sobre o produto..." />
                </div>
              </div>
              <DialogFooter className="bg-muted/30 p-8 rounded-b-[2.5rem] border-t">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl px-6">Cancelar</Button>
                <Button onClick={handleSaveProduct} className="rounded-xl px-12 bg-primary font-bold shadow-lg shadow-primary/20">
                  {editingProduct ? "Atualizar Produto" : "Cadastrar Agora"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar por nome, SKU ou categoria..." className="pl-12 h-14 rounded-2xl bg-card border-none shadow-sm text-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <Card className="border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b-muted/20 hover:bg-transparent">
                <TableHead className="font-bold py-6 px-8 text-foreground uppercase tracking-wider text-xs">Produto</TableHead>
                <TableHead className="font-bold text-foreground uppercase tracking-wider text-xs text-center">Categoria</TableHead>
                <TableHead className="text-right font-bold text-foreground uppercase tracking-wider text-xs">Venda</TableHead>
                <TableHead className="text-right font-bold text-foreground uppercase tracking-wider text-xs">Estoque</TableHead>
                <TableHead className="text-right font-bold px-8 text-foreground uppercase tracking-wider text-xs">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary opacity-50" /></TableCell>
                </TableRow>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <TableRow key={p.id} className="hover:bg-primary/5 border-b-muted/10 transition-colors">
                    <TableCell className="font-semibold px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-foreground">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono tracking-tighter uppercase font-bold">{p.sku || "Sem SKU"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="rounded-lg bg-muted/60 text-foreground border-none font-bold px-3 py-1">
                        {p.categoryId}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary font-mono text-base">
                      R$ {p.salePrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className={cn("font-bold text-base", p.stockQuantity <= (p.minStockQuantity || 5) ? 'text-destructive' : 'text-foreground')}>
                          {p.stockQuantity} {p.unitOfMeasure || 'un'}
                        </span>
                        {p.stockQuantity <= (p.minStockQuantity || 5) && (
                          <span className="text-[9px] font-bold text-destructive uppercase tracking-tighter">Nível Crítico</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(p)} className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProduct(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-muted-foreground opacity-50">
                      <Package className="h-20 w-20" />
                      <div className="space-y-1">
                        <p className="text-xl font-bold">Catálogo Vazio</p>
                        <p className="text-sm">Comece cadastrando seu primeiro produto agora.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </Shell>
  );
}
