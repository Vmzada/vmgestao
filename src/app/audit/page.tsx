"use client";

import React, { useState, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { 
  ShieldAlert, 
  Search, 
  History, 
  FileText, 
  Package, 
  ShoppingCart,
  Loader2,
  Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";

const actionIcons: any = {
  "Venda Realizada": ShoppingCart,
  "Produto Cadastrado": Package,
  "Produto Atualizado": Package,
  "Produto Removido": Package,
  "Configurações Alteradas": ShieldAlert,
};

export default function AuditPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const auditQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "audit_logs"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }, [db, user]);

  const { data: logs, isLoading } = useCollection(auditQuery);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  return (
    <Shell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-primary">
              <ShieldAlert className="h-8 w-8" /> Auditoria do Sistema
            </h1>
            <p className="text-muted-foreground mt-1">Histórico de ações críticas e rastreabilidade.</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por ação ou ID do documento..." 
            className="pl-10 h-12 rounded-2xl bg-card border-none shadow-sm text-foreground" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="border-none shadow-xl bg-card rounded-[2rem] overflow-hidden">
          {isLoading ? (
            <div className="p-20 flex justify-center flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Carregando histórico...</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b-muted/20">
                  <TableHead className="font-bold text-foreground py-4 px-6">Data / Hora</TableHead>
                  <TableHead className="font-bold text-foreground">Ação</TableHead>
                  <TableHead className="font-bold text-foreground">Alvo</TableHead>
                  <TableHead className="font-bold text-foreground">Documento ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const Icon = actionIcons[log.action] || FileText;
                  return (
                    <TableRow key={log.id} className="hover:bg-primary/5 transition-colors border-b-muted/10">
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-foreground">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-lg capitalize bg-muted/50 text-foreground border-none">
                          {log.targetCollection}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">
                        {log.targetId}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="bg-card p-20 text-center space-y-4">
              <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
                <History className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-foreground">Sem registros</p>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                  As ações realizadas no sistema aparecerão aqui para sua segurança.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}
