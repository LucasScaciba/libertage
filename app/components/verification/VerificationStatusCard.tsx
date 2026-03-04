'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Clock, XCircle, AlertCircle, Upload } from 'lucide-react';
import type { VerificationStatus } from '@/types';

interface VerificationStatusCardProps {
  status: VerificationStatus;
  verifiedAt?: Date | string;
  expiresAt?: Date | string;
  rejectionReason?: string;
  submittedAt?: Date | string;
  onSubmitNew?: () => void;
}

export function VerificationStatusCard({
  status,
  verifiedAt,
  expiresAt,
  rejectionReason,
  submittedAt,
  onSubmitNew,
}: VerificationStatusCardProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiry = () => {
    if (!expiresAt) return 0;
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: ShieldCheck,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          badge: 'Verificado',
          badgeVariant: 'default' as const,
          title: 'Perfil Verificado',
          description: 'Seu perfil foi verificado com sucesso',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          badge: 'Em Análise',
          badgeVariant: 'secondary' as const,
          title: 'Verificação em Análise',
          description: 'Sua solicitação está sendo revisada pela nossa equipe',
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          badge: 'Rejeitado',
          badgeVariant: 'destructive' as const,
          title: 'Verificação Rejeitada',
          description: 'Sua solicitação foi rejeitada',
        };
      case 'expired':
        return {
          icon: AlertCircle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          badge: 'Expirado',
          badgeVariant: 'secondary' as const,
          title: 'Verificação Expirada',
          description: 'Sua verificação expirou após 90 dias',
        };
      default:
        return {
          icon: Upload,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          badge: 'Não Verificado',
          badgeVariant: 'outline' as const,
          title: 'Perfil Não Verificado',
          description: 'Verifique seu perfil para aumentar a confiança dos usuários',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <Icon className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
          </div>
          <Badge variant={config.badgeVariant}>{config.badge}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'verified' && verifiedAt && expiresAt && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Verificado em: <span className="font-medium">{formatDate(verifiedAt)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Expira em: <span className="font-medium">{formatDate(expiresAt)}</span>
            </p>
            {daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sua verificação expira em {daysUntilExpiry} dias. Envie uma nova solicitação para
                  manter seu perfil verificado.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {status === 'pending' && submittedAt && (
          <p className="text-sm text-muted-foreground">
            Enviado em: <span className="font-medium">{formatDate(submittedAt)}</span>
          </p>
        )}

        {status === 'rejected' && rejectionReason && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Motivo:</strong> {rejectionReason}
            </AlertDescription>
          </Alert>
        )}

        {(status === 'not_verified' || status === 'rejected' || status === 'expired') && (
          <Button onClick={onSubmitNew} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {status === 'not_verified' ? 'Verificar Perfil' : 'Enviar Nova Solicitação'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
