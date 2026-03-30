"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, Button, Card, CardContent } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/infrastructure/supabase/client";
import { useRouter } from "next/navigation";

export default function PerfilPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const initials = email ? email.slice(0, 2).toUpperCase() : "?";
  const displayName = email ? email.split("@")[0] : "Cargando...";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <Card className="border border-[var(--color-outline-variant)]">
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="bg-cyan-500 text-white w-16 h-16 text-2xl">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-[var(--color-on-surface)] truncate">
              {displayName}
            </h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] truncate">
              {email ?? "..."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border border-[var(--color-outline-variant)]">
        <CardContent className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-red-500 hover:bg-red-50"
            onPress={handleLogout}
          >
            <Icon icon="material-symbols:logout-outline" className="text-xl" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
