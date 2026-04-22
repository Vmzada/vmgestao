"use client";

import React from "react";
import { Shell } from "@/components/layout/Shell";
import { Bell, Info } from "lucide-react";

export default function NotificationsPage() {
  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" /> Notificações
        </h1>
        <div className="bg-card border rounded-3xl p-12 text-center space-y-4">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
            <Info className="h-8 w-8" />
          </div>
          <p className="text-muted-foreground">Você não tem novas notificações no momento.</p>
        </div>
      </div>
    </Shell>
  );
}