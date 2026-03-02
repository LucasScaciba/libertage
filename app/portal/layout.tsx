"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    // TODO: Implement actual logout logic
    router.push("/");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}>
        <div className="container-custom" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem" }}>
          {/* Logo */}
          <Link href="/portal">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <Image src="/libertage-logo.svg" alt="Libertage" width={150} height={45} priority />
            </div>
          </Link>

          {/* Right Side - User Info and Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* User Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ 
                width: "2.5rem", 
                height: "2.5rem", 
                borderRadius: "50%", 
                backgroundColor: "hsl(var(--primary))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "600",
                fontSize: "0.875rem"
              }}>
                MS
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>Maria Silva</span>
                <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>maria@email.com</span>
              </div>
            </div>

            {/* Logout Button */}
            <Button variant="ghost" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
