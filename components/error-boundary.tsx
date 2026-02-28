'use client';

import React, { Component, ReactNode } from 'react';
import { logger } from '@/lib/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component to catch React rendering errors
 * 
 * @example
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console and external service
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
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
          Algo deu errado
        </h2>
        <p className="mt-2 text-sm text-center text-gray-600">
          Ocorreu um erro inesperado. Por favor, tente recarregar a página.
        </p>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <summary className="cursor-pointer font-medium text-gray-700">
              Detalhes do erro (apenas em desenvolvimento)
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-red-600">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Recarregar página
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom error fallback for specific sections
 */
export function SectionErrorFallback({ 
  error, 
  reset 
}: { 
  error?: Error; 
  reset?: () => void;
}) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-600 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Erro ao carregar esta seção
          </h3>
          <p className="mt-1 text-sm text-red-700">
            Não foi possível carregar o conteúdo. Por favor, tente novamente.
          </p>
          {process.env.NODE_ENV === 'development' && error && (
            <p className="mt-2 text-xs text-red-600 font-mono">
              {error.message}
            </p>
          )}
          {reset && (
            <button
              onClick={reset}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
