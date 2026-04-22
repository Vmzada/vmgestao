"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
      <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">Carregando VM Gestão...</p>
    </div>
  );
}
