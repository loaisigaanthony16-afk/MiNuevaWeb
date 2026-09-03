"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";

export default function ShopExperience({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Navbar onOpenCart={() => setDrawerOpen(true)} />
      {children}
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
