"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { 
  Settings, 
  Store, 
  Bell, 
  Shield, 
  Database, 
  Save,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Configurações salvas!",
        description: "As alterações do Vm Gestão foram aplicadas.",
      });
    }, 1000);
  };

  return (
    <Shell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">Configurações do Sistema</h1>
          <p className="text-muted-foreground mt-1 text-lg">Personalize sua experiência no Vm Gestão Financeira.</p>
        </div>

        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl shadow-sm border h-12">
            <TabsTrigger value="geral" className="rounded-lg gap-2 px-6">
              <Store className="h-4 w-4" /> Geral
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="rounded-lg gap-2 px-6">
              <Bell className="h-4 w-4" /> Notificações
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="rounded-lg gap-2 px-6">
              <Shield className="h-4 w-4" /> Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <Card className="border-none shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-xl">Informações da Empresa</CardTitle>
                <CardDescription>Dados principais que aparecerão nos recibos e relatórios financeiros.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="store-name">Nome da Empresa</Label>
                    <Input id="store-name" defaultValue="Vm Gestão Financeira" className="rounded-xl bg-muted border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ / CPF</Label>
                    <Input id="cnpj" defaultValue="00.000.000/0001-00" className="rounded-xl bg-muted border-none" />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Regras de Negócio</h3>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">Bloquear estoque negativo</Label>
                      <p className="text-sm text-muted-foreground">Impede a venda se não houver saldo físico disponível.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 p-6 flex justify-end gap-3 border-t">
                <Button variant="outline" className="rounded-xl">Descartar</Button>
                <Button onClick={handleSave} disabled={isSaving} className="rounded-xl px-8 shadow-lg shadow-primary/20 bg-primary">
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notificacoes">
            <Card className="border-none shadow-sm p-6 bg-card">
              <p className="text-muted-foreground">Ajustes de notificações para Vm Gestão.</p>
            </Card>
          </TabsContent>
          
          <TabsContent value="seguranca">
            <Card className="border-none shadow-sm p-6 bg-card">
              <p className="text-muted-foreground">Ajustes de segurança para sua conta financeira.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}