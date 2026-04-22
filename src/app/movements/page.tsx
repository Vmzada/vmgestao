"use client";

import React, { useState, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { 
  Search, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RotateCcw, 
  ShoppingBag,
  History,
  Download,
  Loader2
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { cn } from "@/lib/utils";

const typeIcons: any = {
  entrada: ArrowUpCircle,
  saida: ArrowDownCircle,
  venda: ShoppingBag,
  ajuste: History,
  cancelamento: RotateCcw
};

const typeColors: any = {
  entrada: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
  venda: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
  ajuste: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
  saida: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
};

export default function MovementsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const movementsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "movements"),
      where("userId", "==", user.uid)
    );
  }, [db, user]);

  const { data: movements, isLoading } = useCollection(movementsQuery);

  const sortedMovements = useMemo(() => {
    if (!movements) return [];
    return [...movements].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [movements]);

  const filtered = sortedMovements.filter(m => 
    m.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">Movimentações</h1>
            <p className="text-muted-foreground">Histórico completo de estoque - Vm Gestão</p>
          </div>
          <Button variant="outline" className="rounded-xl gap-2"><Download className="h-5 w-5" /> Exportar</Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Filtrar por produto ou tipo..." className="pl-10 h-12 rounded-xl bg-card border-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <Card className="border-none shadow-sm bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-foreground font-bold">Data</TableHead>
                  <TableHead className="text-foreground font-bold">Produto</TableHead>
                  <TableHead className="text-foreground font-bold">Tipo</TableHead>
                  <TableHead className="text-right text-foreground font-bold">Qtd</TableHead>
                  <TableHead className="text-right text-foreground font-bold">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const Icon = typeIcons[m.type] || History;
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/10 border-b-muted/20">
                      <TableCell className="font-mono text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-semibold text-foreground">{m.productName}</TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-lg capitalize gap-1", typeColors[m.type])} variant="secondary">
                          <Icon className="h-3 w-3" /> {m.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-right font-bold", m.quantity > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">{m.newStockQuantity}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">Nenhuma movimentação registrada.</div>
          )}
        </Card>
      </div>
    </Shell>
  );
}
