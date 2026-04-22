"use client";

import React, { useState, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { 
  Search, 
  Plus, 
  Minus, 
  ShoppingCart, 
  CheckCircle2,
  X,
  Package,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function POSPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [isFinished, setIsFinished] = useState(false);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "products"), where("userId", "==", user.uid), where("isActive", "==", true));
  }, [db, user]);

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku?.includes(searchTerm)
    );
  }, [products, searchTerm]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantidade + 1 > product.stockQuantity) {
        toast({ title: "Estoque insuficiente!", variant: "destructive" });
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantidade: item.quantidade + 1 } : item));
    } else {
      if (product.stockQuantity <= 0) {
        toast({ title: "Sem estoque!", variant: "destructive" });
        return;
      }
      setCart([...cart, { ...product, quantidade: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantidade + delta;
        const product = products?.find(p => p.id === id);
        if (newQty > (product?.stockQuantity || 0)) return item;
        if (newQty <= 0) return item;
        return { ...item, quantidade: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));

  const total = cart.reduce((acc, item) => acc + (item.salePrice * item.quantidade), 0);

  const handleFinishSale = async () => {
    if (cart.length === 0 || !user || !db) return;

    const saleId = doc(collection(db, "sales")).id;
    const now = new Date().toISOString();

    setDocumentNonBlocking(doc(db, "sales", saleId), {
      id: saleId,
      userId: user.uid,
      userName: user.displayName || user.email,
      totalAmount: total,
      paymentMethod,
      status: "concluida",
      createdAt: now,
    }, { merge: true });

    cart.forEach(item => {
      const itemRef = doc(collection(db, `sales/${saleId}/items`));
      setDocumentNonBlocking(itemRef, {
        id: itemRef.id,
        saleId,
        productId: item.id,
        productName: item.name,
        quantity: item.quantidade,
        unitPrice: item.salePrice,
        subtotal: item.salePrice * item.quantidade
      }, { merge: true });

      const newStock = item.stockQuantity - item.quantidade;
      setDocumentNonBlocking(doc(db, "products", item.id), { stockQuantity: newStock }, { merge: true });

      const movementRef = doc(collection(db, "movements"));
      setDocumentNonBlocking(movementRef, {
        id: movementRef.id,
        productId: item.id,
        productName: item.name,
        type: "venda",
        quantity: -item.quantidade,
        previousStockQuantity: item.stockQuantity,
        newStockQuantity: newStock,
        userId: user.uid,
        userName: user.displayName || user.email,
        saleId,
        createdAt: now
      }, { merge: true });
    });

    const auditRef = doc(collection(db, "audit_logs"));
    setDocumentNonBlocking(auditRef, {
      id: auditRef.id,
      userId: user.uid,
      userName: user.displayName || user.email,
      action: "Venda Realizada",
      details: `Venda ${saleId} finalizada no valor de R$ ${total.toFixed(2)}`,
      targetCollection: "sales",
      targetId: saleId,
      createdAt: now,
    }, { merge: true });

    setIsFinished(true);
    toast({ title: "Venda Finalizada!" });
  };

  if (isFinished) {
    return (
      <Shell>
        <div className="max-w-2xl mx-auto py-12 text-center space-y-8">
          <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold font-headline">Venda Confirmada!</h1>
          <p className="text-muted-foreground">O estoque foi atualizado e a auditoria registrada.</p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
            <Button 
              className="h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 bg-primary" 
              onClick={() => { setCart([]); setIsFinished(false); }}
            >
              Nova Venda
            </Button>
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full h-14 rounded-2xl text-lg font-semibold gap-2">
                <ArrowLeft className="h-5 w-5" /> Voltar ao Menu Principal
              </Button>
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="h-full flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center gap-4">
            <h1 className="text-3xl font-bold font-headline">Frente de Caixa (PDV)</h1>
            <div className="relative w-80">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Buscar produto..." className="pl-10 h-12 rounded-2xl bg-card border-none shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>

          {productsLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map(p => (
                <Card key={p.id} className="cursor-pointer hover:shadow-lg transition-all active:scale-95 bg-card border-none rounded-3xl group" onClick={() => addToCart(p)}>
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors"><Package className="h-5 w-5" /></div>
                      <Badge variant={p.stockQuantity <= (p.minStockQuantity || 5) ? "destructive" : "secondary"} className="rounded-lg">{p.stockQuantity} un</Badge>
                    </div>
                    <h3 className="font-bold text-sm line-clamp-2 h-10">{p.name}</h3>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xl font-bold text-primary font-mono">R$ {p.salePrice?.toFixed(2)}</span>
                      <Button size="icon" className="h-10 w-10 rounded-xl shadow-md"><Plus className="h-5 w-5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground bg-card rounded-[2rem] border-2 border-dashed border-muted">
                  Nenhum produto encontrado.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full lg:w-[450px]">
          <Card className="h-[calc(100vh-12rem)] flex flex-col shadow-2xl rounded-[2.5rem] overflow-hidden bg-card border-none sticky top-24">
            <CardHeader className="bg-muted/50 p-6 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Carrinho de Compras
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 p-12 text-center gap-4">
                  <ShoppingCart className="h-20 w-20" />
                  <p className="font-medium">O carrinho está vazio</p>
                </div>
              ) : (
                <div className="divide-y border-b">
                  {cart.map(item => (
                    <div key={item.id} className="p-4 space-y-3 bg-card/50">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-sm flex-1">{item.name}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /></Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
                          <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8"><Minus className="h-4 w-4" /></Button>
                          <span className="font-bold w-10 text-center">{item.quantidade}</span>
                          <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
                        </div>
                        <span className="font-bold text-primary text-lg">R$ {(item.salePrice * item.quantidade).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/50 p-8 flex-col gap-6">
              <div className="w-full flex justify-between items-center">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total</span>
                <span className="text-4xl font-bold text-primary font-mono">R$ {total.toFixed(2)}</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 w-full">
                {["Dinheiro", "Crédito", "Débito", "PIX"].map(m => (
                  <Button 
                    key={m} 
                    variant={paymentMethod === m ? "default" : "outline"} 
                    onClick={() => setPaymentMethod(m)} 
                    className={cn(
                      "h-12 text-[10px] font-bold rounded-xl transition-all", 
                      paymentMethod === m ? "shadow-md shadow-primary/20 scale-105" : "border-muted-foreground/20 hover:border-primary/50"
                    )}
                  >
                    {m}
                  </Button>
                ))}
              </div>

              <Button 
                className="w-full h-20 text-2xl font-bold rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" 
                disabled={cart.length === 0} 
                onClick={handleFinishSale}
              >
                FINALIZAR VENDA
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
