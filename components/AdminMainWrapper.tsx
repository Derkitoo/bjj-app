"use client";

import { useEffect, useState } from "react";

export default function AdminMainWrapper({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const check = () => setCollapsed(localStorage.getItem("sidebarCollapsed") === "1");
    check();
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  return (
    <main
      className={`transition-all duration-200 pb-20 md:pb-0 ${collapsed ? "md:ml-[68px]" : "md:ml-64"}`}
    >
      {children}
    </main>
  );
}
