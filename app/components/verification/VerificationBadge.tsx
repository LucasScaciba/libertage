'use client';

import { ShieldCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerificationBadgeProps {
  isVerified: boolean;
  verifiedAt?: Date | string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function VerificationBadge({
  isVerified,
  verifiedAt,
  size = 'md',
  showTooltip = true,
}: VerificationBadgeProps) {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const badge = (
    <div
      className="inline-flex items-center justify-center"
      aria-label="Perfil verificado"
    >
      <ShieldCheck
        className={`${sizeClasses[size]} text-blue-500`}
        fill="currentColor"
      />
    </div>
  );

  if (!showTooltip || !verifiedAt) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>Perfil verificado em {formatDate(verifiedAt)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
