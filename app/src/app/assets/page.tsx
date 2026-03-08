"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { getLatestSnapshot } from "@/lib/supabase/queries";
import type { FullSnapshot } from "@/lib/types";
import XtbDetail from "@/components/assets/XtbDetail";
import TriiDetail from "@/components/assets/TriiDetail";
import SavingsDetail from "@/components/assets/SavingsDetail";

export default function AssetsPage() {
  const [data, setData] = useState<FullSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestSnapshot()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-zinc-500">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <Tabs defaultValue="xtb">
        <TabsList className="w-full bg-zinc-900">
          <TabsTrigger value="xtb" className="flex-1">
            XTB
          </TabsTrigger>
          <TabsTrigger value="trii" className="flex-1">
            Trii
          </TabsTrigger>
          <TabsTrigger value="savings" className="flex-1">
            Ahorros
          </TabsTrigger>
        </TabsList>
        <TabsContent value="xtb">
          <XtbDetail data={data} />
        </TabsContent>
        <TabsContent value="trii">
          <TriiDetail data={data} />
        </TabsContent>
        <TabsContent value="savings">
          <SavingsDetail data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
