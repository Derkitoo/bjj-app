import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default async function EleveLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <Sidebar role="ELEVE" />
      <main className="md:ml-60 pb-20 md:pb-0" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="p-6 md:p-8">{children}</div>
      </main>
      <BottomNav role="ELEVE" />
    </div>
  );
}
