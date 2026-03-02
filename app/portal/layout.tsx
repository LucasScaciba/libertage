"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ 
                  width: "2.5rem", 
                  height: "2.5rem", 
                  borderRadius: "50%", 
                  backgroundColor: "hsl(var(--muted))",
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <div style={{ width: "6rem", height: "0.875rem", backgroundColor: "hsl(var(--muted))", borderRadius: "0.25rem" }} />
                  <div style={{ width: "8rem", height: "0.75rem", backgroundColor: "hsl(var(--muted))", borderRadius: "0.25rem" }} />
                </div>
              </div>
            ) : user ? (
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
                  {getInitials(user.name)}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>{user.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>{user.email}</span>
                </div>
              </div>
            ) : null}

            {/* Logout Button */}
            <Button variant="ghost" onClick={handleLogout} disabled={loading}>
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
