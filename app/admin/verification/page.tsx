import { AdminVerificationReview } from '@/app/components/verification/AdminVerificationReview';

export default function AdminVerificationPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verificações Pendentes</h1>
        <p className="text-muted-foreground mt-2">
          Revise e aprove ou rejeite solicitações de verificação de perfil
        </p>
      </div>

      <AdminVerificationReview />
    </div>
  );
}
