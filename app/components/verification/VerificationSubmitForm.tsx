'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface VerificationSubmitFormProps {
  onSuccess?: () => void;
}

export function VerificationSubmitForm({ onSuccess }: VerificationSubmitFormProps) {
  const [documentType, setDocumentType] = useState<'RG' | 'CNH'>('RG');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato inválido. Use JPEG, PNG ou WebP.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Imagem muito grande. Tamanho máximo: 10MB.');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Selecione uma imagem');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('selfieImage', selectedFile);

      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar solicitação');
      }

      toast.success('Solicitação enviada com sucesso!');
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setDocumentType('RG');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar Verificação</CardTitle>
        <CardDescription>
          Envie uma selfie segurando seu documento com foto para verificar seu perfil
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de Documento</Label>
            <RadioGroup
              value={documentType}
              onValueChange={(value) => setDocumentType(value as 'RG' | 'CNH')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="RG" id="rg" />
                <Label htmlFor="rg" className="font-normal cursor-pointer">
                  RG (Registro Geral)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CNH" id="cnh" />
                <Label htmlFor="cnh" className="font-normal cursor-pointer">
                  CNH (Carteira Nacional de Habilitação)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label>Selfie com Documento</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Trocar Imagem
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Imagem
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    JPEG, PNG ou WebP até 10MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Instruções:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Tire uma selfie segurando seu documento ao lado do rosto</li>
                <li>Certifique-se de que seu rosto e o documento estejam visíveis</li>
                <li>A foto deve estar nítida e bem iluminada</li>
                <li>O documento deve estar aberto na página com sua foto</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={!selectedFile || isSubmitting}>
            {isSubmitting ? (
              <>Enviando...</>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Enviar Solicitação
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
