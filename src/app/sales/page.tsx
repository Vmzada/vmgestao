
"use client";

import React, { useState, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { 
  Search, 
  ReceiptText, 
  Trash2, 
  Edit, 
  Loader2, 
  ChevronDown,
  ChevronUp,
  XCircle,
  CheckCircle2,
  Package,
  ArrowRight,
  AlertTriangle,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, getDocs, getDoc } from "firebase/firestore";
import { updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SalesHistoryPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [newTotalAmount, setNewTotalAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const [saleToAction, setSaleToAction] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const salesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "sales"), where("userId", "==", user.uid));
  }, [db, user]);

  const { data: sales, isLoading } = useCollection(salesQuery);

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return [...sales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter(s => 
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [sales, searchTerm]);

  const handleConfirmAction = async () => {
    if (!db || !user || !saleToAction) return;
    
    const sale = saleToAction;
    setIsProcessing(sale.id);
    setShowConfirmDialog(false);
    const now = new Date().toISOString();

    try {
      // Devolver ao estoque apenas se a venda estava concluída
      if (sale.status === 'concluida') {
        const itemsRef = collection(db, "sales", sale.id, "items");
        const itemsSnap = await getDocs(itemsRef);
        
        for (const itemDoc of itemsSnap.docs) {
          const item = itemDoc.data();
          const productRef = doc(db, "products", item.productId);
          
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const currentStock = productSnap.data().stockQuantity || 0;
            const newStock = currentStock + (item.quantity || 0);
            
            updateDocumentNonBlocking(productRef, { stockQuantity: newStock });

            // Registrar a movimentação de estorno
            const movementRef = doc(collection(db, "movements"));
            setDocumentNonBlocking(movementRef, {
              id: movementRef.id,
              productId: item.productId,
              productName: item.productName,
              type: "cancelamento",
              quantity: item.quantity,
              previousStockQuantity: currentStock,
              newStockQuantity: newStock,
              userId: user.uid,
              userName: user.displayName || user.email,
              details: `Estorno da Venda ${sale.id}`,
              createdAt: now
            }, { merge: true });
          }
        }
      }

      // Deletar a venda definitivamente
      deleteDocumentNonBlocking(doc(db, "sales", sale.id));

      // Registrar auditoria
      const auditRef = doc(collection(db, "audit_logs"));
      setDocumentNonBlocking(auditRef, {
        id: auditRef.id,
        userId: user.uid,
        userName: user.displayName || user.email,
        action: "Venda Removida",
        targetCollection: "sales",
        targetId: sale.id,
        details: `Venda ${sale.id} removida do histórico permanentemente.`,
        createdAt: now,
      }, { merge: true });

      toast({ title: "Venda removida com sucesso!" });
    } catch (error) {
      console.error("Erro ao excluir venda:", error);
      toast({ title: "Erro ao processar exclusão", variant: "destructive" });
    } finally {
      setIsProcessing(null);
      setSaleToAction(null);
    }
  };

  const handleUpdateSale = () => {
    if (!db || !editingSale) return;

    updateDocumentNonBlocking(doc(db, "sales", editingSale.id), { 
      paymentMethod: newPaymentMethod,
      totalAmount: Number(newTotalAmount),
      updatedAt: new Date().toISOString()
    });

    const auditRef = doc(collection(db, "audit_logs"));
    setDocumentNonBlocking(auditRef, {
      id: auditRef.id,
      userId: user.uid,
      userName: user.displayName || user.email,
      action: "Venda Alterada",
      targetCollection: "sales",
      targetId: editingSale.id,
      details: `Venda ${editingSale.id} alterada: Novo valor R$ ${Number(newTotalAmount).toFixed(2)}, Novo método: ${newPaymentMethod}`,
      createdAt: new Date().toISOString(),
    }, { merge: true });

    toast({ title: "Venda atualizada com sucesso." });
    setEditingSale(null);
  };

  return (
    <Shell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
              <ReceiptText className="h-8 w-8" /> Gestão de Vendas
            </h1>
            <p className="text-muted-foreground mt-1">Histórico completo e controle de transações financeiras.</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por ID ou método de pagamento..." 
            className="pl-12 h-14 rounded-2xl bg-card border-none shadow-sm" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden">
          {isLoading ? (
            <div className="p-20 flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Carregando...</p>
            </div>
          ) : filteredSales.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent border-b-muted/20">
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="font-bold py-6 px-4 text-foreground text-xs uppercase">Data / ID</TableHead>
                    <TableHead className="font-bold text-foreground text-xs uppercase">Pagamento</TableHead>
                    <TableHead className="font-bold text-foreground text-xs uppercase text-right">Total</TableHead>
                    <TableHead className="font-bold text-foreground text-xs uppercase text-center">Status</TableHead>
                    <TableHead className="font-bold text-foreground text-xs uppercase text-right px-8">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <React.Fragment key={sale.id}>
                      <TableRow className={cn("hover:bg-primary/5 transition-colors border-b-muted/10", sale.status === 'cancelada' && "bg-destructive/5 opacity-70")}>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg"
                            onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                          >
                            {expandedSale === sale.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {sale.id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-primary font-bold">
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg font-mono text-primary">
                          R$ {sale.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          {sale.status === "concluida" ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-none rounded-lg gap-1">
                              <CheckCircle2 className="h-3 v-3" /> Concluída
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="rounded-lg gap-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-none">
                              <XCircle className="h-3 w-3" /> Cancelada
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <div className="flex justify-end gap-2">
                            {isProcessing === sale.id ? (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                {sale.status === 'concluida' && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                                    onClick={() => {
                                      setEditingSale(sale);
                                      setNewPaymentMethod(sale.paymentMethod);
                                      setNewTotalAmount(sale.totalAmount.toString());
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setSaleToAction(sale);
                                    setShowConfirmDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedSale === sale.id && (
                        <TableRow className="bg-muted/10">
                          <TableCell colSpan={6} className="p-0">
                            <div className="p-6 space-y-4">
                              <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Package className="h-4 w-4" /> Detalhes da Operação
                              </h4>
                              <div className="grid gap-4">
                                <p className="text-xs text-muted-foreground italic">Operado por: {sale.userName}</p>
                                <div className="p-4 bg-card rounded-2xl border flex flex-col gap-2">
                                  <p className="text-sm font-medium">Ao excluir esta venda, o sistema processará automaticamente o estorno dos itens para o estoque e removerá o registro financeiro permanentemente desta tela.</p>
                                  <Link href="/movements" className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                                    Ver histórico de movimentações <ArrowRight className="h-3 w-3" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-20 text-center space-y-4">
              <ReceiptText className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
              <p className="text-muted-foreground font-medium">Sem vendas encontradas.</p>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={!!editingSale} onOpenChange={() => setEditingSale(null)}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl bg-card p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold text-primary">Editar Venda</DialogTitle>
            <DialogDescription>Altere o valor ou a forma de pagamento da transação.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
                <DollarSign className="h-3 w-3" /> Valor Total (R$)
              </Label>
              <Input 
                type="number" 
                step="0.01"
                value={newTotalAmount} 
                onChange={e => setNewTotalAmount(e.target.value)}
                className="h-12 rounded-xl bg-muted border-none font-bold text-primary text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest opacity-50">Método de Pagamento</Label>
              <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                <SelectTrigger className="h-12 rounded-xl bg-muted border-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Crédito">Crédito</SelectItem>
                  <SelectItem value="Débito">Débito</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditingSale(null)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleUpdateSale} className="rounded-xl bg-primary px-8 font-bold shadow-lg shadow-primary/20">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl bg-card p-8">
          <DialogHeader className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-headline font-bold text-foreground">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Esta ação irá apagar a venda permanentemente. Se a venda estiver concluída, os produtos serão devolvidos ao estoque automaticamente. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="rounded-xl h-12">Não, Manter</Button>
            <Button onClick={handleConfirmAction} className="rounded-xl h-12 bg-destructive hover:bg-destructive/90 text-white font-bold">Sim, Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
