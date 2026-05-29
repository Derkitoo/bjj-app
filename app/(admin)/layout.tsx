import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import AdminMainWrapper from "@/components/AdminMainWrapper";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "PROF")) {
    redirect("/login");
  }

  const safeRole = role as "ADMIN" | "PROF";

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <Sidebar role={safeRole} />
      <AdminMainWrapper>
        <div className="p-6 md:p-8">{children}</div>
      </AdminMainWrapper>
      <BottomNav role={safeRole} />
    </div>
  );
}
