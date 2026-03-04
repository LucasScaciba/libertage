'use client';

import { useEffect, useState } from 'react';
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

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
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
  );
}
