import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const session = req.auth;

  if ((pathname.startsWith("/admin") || pathname.startsWith("/eleve")) && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && session?.user) {
    const role = (session.user as { role: string }).role;
    if (role !== "ADMIN" && role !== "PROF") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const profRestreint = ["/admin/paiements", "/admin/comptes", "/admin/ceintures", "/admin/dashboard"];
    if (role === "PROF" && profRestreint.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin/presence", req.url));
    }
  }

  if (pathname.startsWith("/eleve") && session?.user) {
    const role = (session.user as { role: string }).role;
    if (role !== "ELEVE" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const motDePasseTemporaire = (session.user as unknown as { motDePasseTemporaire: boolean }).motDePasseTemporaire;
    if (motDePasseTemporaire && pathname !== "/eleve/changer-mot-de-passe") {
      return NextResponse.redirect(new URL("/eleve/changer-mot-de-passe", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/eleve/:path*"],
};
