import type { Metadata } from "next";
import Wordmark from "@/components/Wordmark";
import AdminPanel from "@/components/AdminPanel";

export const metadata: Metadata = {
  title: "Panel · Vibe 505",
  robots: { index: false, follow: false },
};

export default function Admin() {
  return (
    <main className="container-page py-10">
      <div className="mb-8 flex items-center justify-between">
        <Wordmark />
        <span className="text-[11px] font-semibold uppercase tracking-wide2 text-ink-500">Panel de pedidos</span>
      </div>
      <AdminPanel />
    </main>
  );
}
