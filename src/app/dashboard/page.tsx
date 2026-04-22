
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  ShoppingCart,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Busca perfil do usuário para pegar o businessName
  const userProfileQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(userProfileQuery);

  const salesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "sales"),
      where("userId", "==", user.uid)
    );
  }, [db, user]);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "products"),
      where("userId", "==", user.uid)
    );
  }, [db, user]);

  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  const stats = useMemo(() => {
    if (!sales || !isMounted) return { totalToday: 0, countToday: 0, avgTicket: 0 };
    
    const today = new Date().toISOString().split('T')[0];
    const todaysSales = sales.filter(s => s.createdAt?.startsWith(today) && s.status === 'concluida');
    
    const totalToday = todaysSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const countToday = todaysSales.length;
    const avgTicket = countToday > 0 ? totalToday / countToday : 0;

    return { totalToday, countToday, avgTicket };
  }, [sales, isMounted]);

  const criticalStock = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.stockQuantity <= (p.minStockQuantity || 0));
  }, [products]);

  const chartData = useMemo(() => {
    if (!isMounted) return [];
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        name: days[d.getDay()],
        date: d.toISOString().split('T')[0],
        total: 0
      };
    });

    if (sales) {
      sales.forEach(sale => {
        if (sale.status !== 'concluida') return;
        const saleDate = sale.createdAt?.split('T')[0];
        const dayEntry = last7Days.find(d => d.date === saleDate);
        if (dayEntry) {
          dayEntry.total += (sale.totalAmount || 0);
        }
      });
    }

    return last7Days;
  }, [sales, isMounted]);

  if (salesLoading || productsLoading || !isMounted) {
    return (
      <Shell>
        <div className="h-full flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">
              {profile?.businessName || "VM Gestão"}
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Olá, {profile?.name || user?.displayName || "Bem-vindo"}. Gestão financeira simplificada.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/pos">
              <Button className="rounded-2xl shadow-lg shadow-primary/20 bg-primary px-8 h-12">Nova Venda</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-sm bg-card rounded-[2rem]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Faturamento Hoje</CardTitle>
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">R$ {stats.totalToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground mt-2">Total acumulado hoje</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card rounded-[2rem]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Vendas</CardTitle>
              <div className="h-10 w-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary-foreground">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.countToday}</div>
              <p className="text-xs text-muted-foreground mt-2">Pedidos finalizados hoje</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card rounded-[2rem]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Estoque Alerta</CardTitle>
              <div className="h-10 w-10 bg-destructive/10 rounded-xl flex items-center justify-center text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{criticalStock.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Produtos abaixo do mínimo</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card rounded-[2rem]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ticket Médio</CardTitle>
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">R$ {stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground mt-2">Valor médio por venda</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          <Card className="md:col-span-4 border-none shadow-sm rounded-[2rem] overflow-hidden bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Resumo Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'currentColor', fontSize: 12, opacity: 0.5}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'currentColor', fontSize: 12, opacity: 0.5}} />
                    <Tooltip cursor={{fill: 'currentColor', opacity: 0.05}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))'}} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3 border-none shadow-sm rounded-[2rem] overflow-hidden bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Reposição Urgente</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border border-t border-border">
                {criticalStock.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-semibold text-sm text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">Saldo: {p.stockQuantity} {p.unitOfMeasure}</div>
                    </div>
                    <Badge variant="destructive" className="rounded-lg">Repor</Badge>
                  </div>
                ))}
                {criticalStock.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground text-sm opacity-50">
                    Nenhum produto em nível crítico.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
