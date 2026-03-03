"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      checkSubscription();
    }
  }, [loading, user]);

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

  const checkSubscription = async () => {
    // Skip subscription check for plans page (user needs to access it to subscribe)
    if (window.location.pathname === '/portal/plans') {
      setCheckingSubscription(false);
      return;
    }

    try {
      const res = await fetch("/api/profiles/me");
      if (res.ok) {
        const data = await res.json();
        
        // Check if user has active subscription
        const hasActiveSubscription = data.subscription?.status === 'active';
        
        if (!hasActiveSubscription) {
          // Redirect to plans page if no active subscription
          router.push('/portal/plans');
          return;
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setCheckingSubscription(false);
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

  const navigation = [
    { name: "Dashboard", href: "/portal", icon: "📊" },
    { name: "Perfil", href: "/portal/profile", icon: "👤" },
    { name: "Analytics", href: "/portal/analytics", icon: "📈" },
    { name: "Boosts", href: "/portal/boosts", icon: "🚀" },
    { name: "Planos", href: "/portal/plans", icon: "💎" },
  ];

  const isActive = (href: string) => {
    if (href === "/portal") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#f9fafb" }}>
      {/* Sidebar */}
      <aside style={{
        width: "16rem",
        backgroundColor: "white",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "100vh",
        overflowY: "auto"
      }}>
        {/* Logo */}
        <div style={{ padding: "1.5rem 1rem", borderBottom: "1px solid #e5e7eb" }}>
          <Link href="/portal">
            <Image src="/libertage-logo.svg" alt="Libertage" width={120} height={36} priority />
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: isActive(item.href) ? "#111827" : "#6b7280",
                  backgroundColor: isActive(item.href) ? "#f3f4f6" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* User Info */}
        <div style={{ padding: "1rem", borderTop: "1px solid #e5e7eb" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ 
                width: "2.5rem", 
                height: "2.5rem", 
                borderRadius: "50%", 
                backgroundColor: "#e5e7eb",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: "100%", height: "0.875rem", backgroundColor: "#e5e7eb", borderRadius: "0.25rem", marginBottom: "0.25rem" }} />
                <div style={{ width: "80%", height: "0.75rem", backgroundColor: "#e5e7eb", borderRadius: "0.25rem" }} />
              </div>
            </div>
          ) : user ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ 
                  width: "2.5rem", 
                  height: "2.5rem", 
                  borderRadius: "50%", 
                  backgroundColor: "#111827",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "0.875rem"
                }}>
                  {getInitials(user.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.email}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                disabled={loading}
                style={{ width: "100%", fontSize: "0.875rem" }}
              >
                Sair
              </Button>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: "16rem", flex: 1, minHeight: "100vh" }}>
        {checkingSubscription ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                width: "3rem", 
                height: "3rem", 
                border: "3px solid #e5e7eb",
                borderTopColor: "#111827",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto"
              }} />
              <p style={{ marginTop: "1rem", color: "#6b7280" }}>Verificando assinatura...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

