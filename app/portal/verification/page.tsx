'use client';

import { useEffect, useState } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { VerificationStatusCard } from '@/app/components/verification/VerificationStatusCard';
import { VerificationSubmitForm } from '@/app/components/verification/VerificationSubmitForm';
import type { VerificationStatusResponse } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function VerificationPage() {
  const [status, setStatus] = useState<VerificationStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/verification/status');
      const data = await response.json();
      setStatus(data);
      setShowForm(data.status === 'not_verified' || data.status === 'rejected' || data.status === 'expired');
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubmitSuccess = () => {
    setShowForm(false);
    fetchStatus();
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/portal">Portal</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Verificação</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {isLoading ? (
            <div className="container max-w-4xl mx-auto py-8 space-y-6">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="container max-w-4xl mx-auto py-8 space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Verificação de Perfil</h1>
                <p className="text-muted-foreground mt-2">
                  Verifique seu perfil para aumentar a confiança dos usuários da plataforma
                </p>
              </div>

              {status && (
                <VerificationStatusCard
                  status={status.status}
                  verifiedAt={status.verifiedAt}
                  expiresAt={status.expiresAt}
                  rejectionReason={status.rejectionReason}
                  submittedAt={status.submittedAt}
                  onSubmitNew={() => setShowForm(true)}
                />
              )}

              {showForm && <VerificationSubmitForm onSuccess={handleSubmitSuccess} />}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
