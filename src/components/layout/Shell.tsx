
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  Settings, 
  LogOut,
  Bell,
  ChevronRight,
  ShieldAlert,
  Wallet,
  Loader2,
  Moon,
  Sun,
  ReceiptText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Package, label: "Produtos", href: "/products" },
  { icon: ShoppingCart, label: "PDV (Venda)", href: "/pos" },
  { icon: ReceiptText, label: "Vendas", href: "/sales" },
  { icon: History, label: "Movimentações", href: "/movements" },
];

const adminItems = [
  { icon: ShieldAlert, label: "Auditoria", href: "/audit" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const userProfileQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(userProfileQuery);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sessão encerrada",
        description: "Você saiu da sua conta com sucesso.",
      });
      router.push("/login");
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um problema ao tentar encerrar sua sessão.",
        variant: "destructive",
      });
    }
  };

  if (isUserLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="border-b border-border px-6 py-8 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-[1.2rem] bg-primary flex items-center justify-center text-primary-foreground shadow-xl">
                <Wallet className="h-7 w-7" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline font-bold text-xl leading-tight tracking-tight text-primary truncate">
                  {profile?.businessName || "VM Gestão"}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground tracking-tight truncate uppercase">
                  VM Gestão — Financeiro e Controle de Estoque
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="bg-card">
            <SidebarGroup>
              <SidebarGroupLabel className="px-6 py-2 uppercase text-[10px] font-bold tracking-widest text-muted-foreground opacity-50">Principal</SidebarGroupLabel>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.href}
                      className={cn(
                        "h-14 px-6 transition-all duration-200 rounded-none",
                        pathname === item.href 
                          ? "bg-primary/10 border-r-4 border-primary text-primary font-bold" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <Link href={item.href} className="flex items-center w-full gap-4">
                        <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="px-6 py-2 uppercase text-[10px] font-bold tracking-widest text-muted-foreground opacity-50">Gestão</SidebarGroupLabel>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.href}
                      className={cn(
                        "h-14 px-6 transition-all duration-200 rounded-none",
                        pathname === item.href 
                          ? "bg-primary/10 border-r-4 border-primary text-primary font-bold" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <Link href={item.href} className="flex items-center w-full gap-4">
                        <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border p-4 bg-card/50">
            <div className="flex items-center gap-3 px-3 py-3 rounded-[1.5rem] bg-card shadow-sm border border-border">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-inner">
                {(profile?.name || user.displayName?.[0] || user.email?.[0]?.toUpperCase())?.[0]}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-bold truncate text-foreground">{profile?.name || user.displayName || "Usuário"}</span>
                <span className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-widest">Ativo</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 bg-background">
          <header className="h-20 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="text-primary font-bold">{profile?.businessName || "VM Gestão"}</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
                <span className="text-foreground font-semibold">
                  {menuItems.find(m => m.href === pathname)?.label || adminItems.find(m => m.href === pathname)?.label || "Início"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-11 w-11 rounded-[1rem] hover:bg-muted/50 border-border"
                onClick={toggleTheme}
                title={theme === "light" ? "Modo Noturno" : "Modo Claro"}
              >
                {theme === "light" ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-yellow-500" />}
              </Button>

              <Link href="/notifications">
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-[1rem] relative hover:bg-muted/50 border-border">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </Button>
              </Link>
              <div className="h-8 w-[1px] bg-border mx-2" />
              <Link href="/pos">
                <Button variant="default" className="rounded-[1rem] shadow-lg h-11 px-6 hidden sm:flex bg-primary hover:bg-primary/90 font-bold">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Vender
                </Button>
              </Link>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-10 bg-background/50">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
