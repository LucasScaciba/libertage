'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface StoryReportModalProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryReportModal({
  storyId,
  isOpen,
  onClose
}: StoryReportModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Por favor, descreva o motivo da denúncia');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/stories/${storyId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      toast.success('Denúncia enviada com sucesso');
      setReason('');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar denúncia');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Denunciar Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Motivo da denúncia
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da denúncia..."
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Denúncia'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
