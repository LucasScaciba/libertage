'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console and external service
    logger.error('Catalog page error', error, {
      digest: error.digest,
      path: '/catalog',
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-center text-gray-900">
          Erro ao carregar catálogo
        </h2>
        <p className="mt-2 text-sm text-center text-gray-600">
          Não foi possível carregar o catálogo de serviços. Por favor, tente novamente.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            onClick={reset}
            className="flex-1"
          >
            Tentar novamente
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="flex-1"
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  );
}
