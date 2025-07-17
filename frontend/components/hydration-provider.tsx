"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCartStore } from "@/lib/stores/cart-store";

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Hydrate the stores on client side
    useAuthStore.persist.rehydrate();
    useCartStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
