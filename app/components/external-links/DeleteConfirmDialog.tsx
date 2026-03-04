'use client';

/**
 * DeleteConfirmDialog Component
 * 
 * Confirmation dialog for deleting external links.
 * Prevents accidental deletions.
 * 
 * Requirements: 5.6, 5.7
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  linkTitle: string;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  linkTitle,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <div style={{ maxWidth: '425px', margin: '0 auto' }}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div>
                <DialogTitle>Confirmar Remoção</DialogTitle>
                <DialogDescription>
                  Esta ação não pode ser desfeita.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div style={{ padding: '1.5rem' }}>
            <p className="text-sm text-gray-700">
              Tem certeza que deseja remover o link <span className="font-semibold">"{linkTitle}"</span>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              O link será permanentemente removido do seu perfil.
            </p>
          </div>

          <div style={{ 
            padding: '1rem 1.5rem', 
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem'
          }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirm}
            >
              Remover Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
