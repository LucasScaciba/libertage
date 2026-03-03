"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Home,
  User,
  BarChart3,
  Rocket,
  CreditCard,
  LogOut,
} from "lucide-react";

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
    if (window.location.pathname === '/portal/plans') {
      setCheckingSubscription(false);
      return;
    }

    try {
      const res = await fetch("/api/profiles/me");
      if (res.ok) {
        const data = await res.json();
        const hasActiveSubscription = data.subscription?.status === 'active';
        
        if (!hasActiveSubscription) {
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navigation = [
    { name: "Dashboard", href: "/portal", icon: Home },
    { name: "Perfil", href: "/portal/profile", icon: User },
    { name: "Analytics", href: "/portal/analytics", icon: BarChart3 },
    { name: "Boosts", href: "/portal/boosts", icon: Rocket },
    { name: "Planos", href: "/portal/plans", icon: CreditCard },
  ];

  const isActive = (href: string) => {
    if (href === "/portal") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white sm:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/portal" className="flex items-center gap-2 font-semibold">
            <Image src="/libertage-logo.svg" alt="Libertage" width={120} height={36} priority />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="border-t p-4">
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ) : user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={loading}
                className="w-full justify-start gap-2 text-sm"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 sm:pl-64">
        {checkingSubscription ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
              <p className="mt-4 text-sm text-gray-600">Verificando assinatura...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
