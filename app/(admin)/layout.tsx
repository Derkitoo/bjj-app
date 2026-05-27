import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    redirect("/login");
  }

  const safeRole = role as "ADMIN" | "PROF";

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <Sidebar role={safeRole} />
      <main className="md:ml-60 pb-20 md:pb-0">
        <div className="p-6 md:p-8">{children}</div>
      </main>
      <BottomNav role={safeRole} />
    </div>
  );
}
