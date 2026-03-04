'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PendingVerification {
  id: string;
  profile_id: string;
  document_type: string;
  submitted_at: string;
  imageUrl: string;
  profiles: {
    display_name: string;
    slug: string;
  };
}

export function AdminVerificationReview() {
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPendingVerifications = async () => {
    try {
      const response = await fetch('/api/verification/admin/pending');
      const data = await response.json();
      setVerifications(data.verifications || []);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      toast.error('Erro ao carregar verificações pendentes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const handleApprove = async (verificationId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/verification/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId,
          action: 'approve',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aprovar verificação');
      }

      toast.success('Verificação aprovada com sucesso!');
      fetchPendingVerifications();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification || !rejectionReason.trim()) {
      toast.error('Motivo da rejeição é obrigatório');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/verification/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: selectedVerification.id,
          action: 'reject',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao rejeitar verificação');
      }

      toast.success('Verificação rejeitada');
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedVerification(null);
      fetchPendingVerifications();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Clock className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (verifications.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Não há verificações pendentes no momento.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {verifications.map((verification) => (
          <Card key={verification.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {verification.profiles.display_name}
                </CardTitle>
                <Badge variant="secondary">{verification.document_type}</Badge>
              </div>
              <CardDescription>
                Enviado em {formatDate(verification.submitted_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {verification.imageUrl ? (
                <img
                  src={verification.imageUrl}
                  alt="Verification"
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Imagem não disponível</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleApprove(verification.id)}
                  disabled={isProcessing}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setSelectedVerification(verification);
                    setShowRejectDialog(true);
                  }}
                  disabled={isProcessing}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Rejeitar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Verificação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para {selectedVerification?.profiles.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Rejeição</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Documento não está visível, foto está desfocada, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setSelectedVerification(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isProcessing}
            >
              {isProcessing ? 'Rejeitando...' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
